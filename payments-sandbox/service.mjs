import { randomUUID, timingSafeEqual } from 'node:crypto';
import { LabError, input, hash, assertRemote, remoteStatus, nextStatus, dto, events, idPattern } from './domain.mjs';
import { ProviderError } from './providers.mjs';

export class Payments {
  constructor(repo, provider, webhookToken) {
    if (typeof webhookToken !== 'string' || !/^[^\s]{32,255}$/.test(webhookToken)) throw new Error('Token de webhook deve ter 32 a 255 caracteres, sem espacos.');
    this.repo = repo; this.provider = provider; this.token = webhookToken;
    this.reconciliations = new Map();
  }

  charge(id) {
    const record = this.repo.state.charges.find(item => item.id === id);
    if (!record) throw new LabError(404, 'Cobranca nao encontrada.');
    return structuredClone(record);
  }

  async create(body, key) {
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key ?? '')) throw new LabError(400, 'Chave de idempotencia obrigatoria, com 16 a 100 caracteres.');
    const normalized = input(body, { allowPast: true }); const fingerprint = hash(normalized);
    const previous = this.repo.state.charges.find(item => item.requestKey === key);
    if (previous) {
      if (previous.requestHash !== fingerprint) throw new LabError(409, 'Chave ja usada para outra cobranca.');
      return { charge: dto(previous), replay: true };
    }
    input(body);
    if (this.repo.state.charges.some(item => item.requestHash === fingerprint && ['CREATING', 'UNCERTAIN'].includes(item.status))) {
      throw new LabError(409, 'Ja existe uma criacao igual sem resultado confirmado. Conciliar antes de outra decisao.');
    }
    const charge = { id: randomUUID(), ...normalized, requestKey: key, requestHash: fingerprint,
      status: 'CREATING', providerId: null, qr: null, warning: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.repo.transact(state => { state.charges.push(charge); });
    let remote;
    try {
      remote = await this.provider.create(charge);
      this.applyRemote(charge.id, remote);
    } catch (error) {
      this.repo.transact(state => {
        const current = state.charges.find(item => item.id === charge.id);
        if (current.status !== 'CREATING') return;
        current.status = error instanceof ProviderError && !error.uncertain ? 'REJECTED' : 'UNCERTAIN';
        current.warning = current.status === 'REJECTED' ? 'Sandbox recusou a criacao. Confira os dados/configuracao.' : 'Criacao sem resultado confirmado. Conciliar; nao repetir o POST.';
      });
      return { charge: dto(this.charge(charge.id)), replay: false };
    }
    await this.loadQr(charge.id);
    return { charge: dto(this.charge(charge.id)), replay: false };
  }

  applyRemote(id, remote) {
    this.repo.transact(state => {
      const charge = state.charges.find(item => item.id === id);
      assertRemote(charge, remote, this.provider.customer);
      charge.providerId = remote.id;
      charge.status = nextStatus(charge.status, remoteStatus(remote));
      charge.warning = null; charge.updatedAt = new Date().toISOString();
    });
  }

  async loadQr(id) {
    const charge = this.charge(id);
    if (!charge.providerId || !['PENDING', 'OVERDUE'].includes(charge.status)) return;
    try {
      const qr = await this.provider.qr(charge.providerId);
      this.repo.transact(state => {
        const current = state.charges.find(item => item.id === id);
        current.qr = qr; current.updatedAt = new Date().toISOString();
      });
    } catch {
      this.repo.transact(state => {
        const current = state.charges.find(item => item.id === id);
        current.warning = 'Cobranca criada; QR indisponivel. Conciliar sem criar novamente.';
        current.updatedAt = new Date().toISOString();
      });
    }
  }

  reconcile(id) {
    if (this.reconciliations.has(id)) return this.reconciliations.get(id);
    const operation = this.doReconcile(id).finally(() => this.reconciliations.delete(id));
    this.reconciliations.set(id, operation);
    return operation;
  }

  async doReconcile(id) {
    const charge = this.charge(id);
    if (charge.status === 'CREATING') throw new LabError(409, 'Criacao em andamento. Aguarde.');
    const remote = charge.providerId ? await this.provider.get(charge.providerId) : await this.provider.find(charge.id);
    if (!remote) throw new LabError(409, 'Ainda sem resultado confirmado no sandbox. Nao repetir a criacao.');
    this.applyRemote(id, remote);
    await this.loadQr(id);
    return dto(this.charge(id));
  }

  async webhook(payload, token) {
    const given = Buffer.from(typeof token === 'string' ? token : '');
    const expected = Buffer.from(this.token);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new LabError(401, 'Webhook nao autenticado.');
    if (typeof payload.id !== 'string' || payload.id.length > 150 || !payload.id || typeof payload.event !== 'string') throw new LabError(400, 'Evento invalido.');
    const supported = Object.hasOwn(events, payload.event);
    const payment = payload.payment;
    const minimal = supported ? { event: payload.event, payment: {
      id: payment?.id, customer: payment?.customer, billingType: payment?.billingType,
      value: payment?.value, externalReference: payment?.externalReference, status: payment?.status,
    } } : { event: payload.event };
    const fingerprint = hash(minimal);
    const previous = this.repo.state.events.find(item => item.id === payload.id);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new LabError(409, 'ID de evento reutilizado com outro conteudo.');
      return { received: true, duplicate: true, disposition: previous.disposition };
    }
    if (!supported) {
      this.repo.transact(state => { state.events.push({ id: payload.id, event: payload.event, fingerprint, disposition: 'ignored', at: new Date().toISOString() }); });
      return { received: true, duplicate: false, disposition: 'ignored' };
    }
    if (!idPattern.test(payment?.id ?? '')) throw new LabError(400, 'ID de pagamento invalido.');
    const charge = this.repo.state.charges.find(item => item.providerId === payment.id || !item.providerId && item.id === payment.externalReference && item.status !== 'REJECTED');
    if (!charge) throw new LabError(409, 'Evento ainda sem cobranca local correspondente.');
    assertRemote(charge, payment, this.provider.customer);
    const next = events[payload.event];
    if (next !== 'CANCELED' && payment.status !== next) throw new LabError(409, 'Evento e estado do pagamento divergem.');
    this.repo.transact(state => {
      const current = state.charges.find(item => item.id === charge.id);
      if (['CREATING', 'UNCERTAIN'].includes(current.status)) current.warning = null;
      current.providerId = payment.id;
      current.status = nextStatus(current.status, next);
      current.updatedAt = new Date().toISOString();
      state.events.push({ id: payload.id, event: payload.event, chargeId: charge.id, fingerprint, disposition: current.status === next ? 'applied' : 'stale', at: new Date().toISOString() });
    });
    return { received: true, duplicate: false, disposition: this.repo.state.events.at(-1).disposition };
  }

  async simulate(id, event) {
    if (this.provider.mode !== 'simulator') throw new LabError(403, 'Simulacao nao existe no modo Asaas.');
    if (!Object.hasOwn(events, event)) throw new LabError(400, 'Evento de teste invalido.');
    const charge = this.charge(id);
    if (!charge.providerId) throw new LabError(409, 'Cobranca ainda nao criada.');
    const desired = events[event];
    if (nextStatus(charge.status, desired) !== desired) throw new LabError(409, 'Transicao de teste nao permitida para este estado.');
    const payment = this.provider.remote(charge);
    payment.status = desired;
    const receipt = await this.webhook({ id: `evt_${randomUUID()}`, event, payment }, this.token);
    this.repo.transact(state => { state.charges.find(item => item.id === id).simulatedStatus = desired; });
    return { charge: dto(this.charge(id)), receipt };
  }
}
