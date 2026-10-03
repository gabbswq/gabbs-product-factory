import QRCode from 'qrcode';
import { LabError, idPattern } from './domain.mjs';

export const ASAAS_ORIGIN = 'https://api-sandbox.asaas.com/v3';

export class ProviderError extends LabError {
  constructor(status, uncertain) {
    super(502, `Sandbox respondeu com falha (${status}); confira a conciliacao.`);
    this.uncertain = uncertain;
  }
}

export class AsaasSandbox {
  constructor({ key, customer, fetchFn = fetch, timeout = 10000 }) {
    if (typeof key !== 'string' || key.length < 10 || /\s|_prod_/i.test(key)) throw new Error('Use somente uma chave Asaas Sandbox no ambiente local.');
    if (!/^cus_[a-zA-Z0-9_-]+$/.test(customer ?? '')) throw new Error('Informe ASAAS_SANDBOX_CUSTOMER_ID de um cliente ficticio do sandbox.');
    this.mode = 'asaas'; this.customer = customer; this.key = key;
    this.fetch = fetchFn; this.timeout = timeout;
  }

  async request(method, route, body) {
    let response;
    try {
      response = await this.fetch(ASAAS_ORIGIN + route, {
        method, redirect: 'error', signal: AbortSignal.timeout(this.timeout),
        headers: { access_token: this.key, 'User-Agent': 'Millennium-Pix-Sandbox/0.1.0', accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch { throw new ProviderError('rede/timeout', true); }
    if (!response.ok) throw new ProviderError(response.status, response.status === 408 || response.status >= 500 || response.status >= 300 && response.status < 400);
    try { return await response.json(); }
    catch { throw new ProviderError('resposta invalida', true); }
  }

  create(charge) {
    return this.request('POST', '/payments', {
      customer: this.customer, billingType: 'PIX', value: charge.amountCents / 100,
      dueDate: charge.dueDate, description: charge.description, externalReference: charge.id,
    });
  }

  get(id) {
    if (!idPattern.test(id)) throw new LabError(400, 'ID de cobranca invalido.');
    return this.request('GET', `/payments/${encodeURIComponent(id)}`);
  }

  async find(reference) {
    const result = await this.request('GET', `/payments?externalReference=${encodeURIComponent(reference)}&limit=2`);
    if (!Array.isArray(result.data) || result.hasMore || result.data.length > 1) throw new LabError(409, 'Referencia ambigua: confira as cobrancas no sandbox.');
    return result.data[0] ?? null;
  }

  async qr(id) {
    if (!idPattern.test(id)) throw new LabError(400, 'ID de cobranca invalido.');
    const result = await this.request('GET', `/payments/${encodeURIComponent(id)}/pixQrCode`);
    const image = typeof result.encodedImage === 'string' ? Buffer.from(result.encodedImage, 'base64') : Buffer.alloc(0);
    if (!image.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) || image.length > 256000 ||
        typeof result.payload !== 'string' || !result.payload || result.payload.length > 4096) throw new LabError(502, 'QR do sandbox invalido.');
    return { image: `data:image/png;base64,${image.toString('base64')}`, payload: result.payload, expirationDate: result.expirationDate ?? null, payable: false, source: 'asaas-sandbox' };
  }
}

export class Simulator {
  constructor(repo) { this.repo = repo; this.mode = 'simulator'; this.customer = 'cus_simulator'; }
  remote(charge) {
    return { id: charge.providerId ?? `sim_${charge.id}`, customer: this.customer, billingType: 'PIX',
      value: charge.amountCents / 100, externalReference: charge.id,
      status: charge.simulatedStatus ?? 'PENDING', deleted: charge.simulatedStatus === 'CANCELED' };
  }
  async create(charge) { return this.remote(charge); }
  async get(id) {
    const charge = this.repo.state.charges.find(item => item.providerId === id);
    if (!charge) throw new LabError(404, 'Cobranca nao encontrada.');
    return this.remote(charge);
  }
  async find(reference) {
    const charge = this.repo.state.charges.find(item => item.id === reference && item.providerId);
    return charge ? this.remote(charge) : null;
  }
  async qr(id) {
    const payload = `MILLENNIUM-SIMULATION:${id}`;
    return { image: await QRCode.toDataURL(payload, { width: 280, margin: 2, errorCorrectionLevel: 'M' }),
      payload, expirationDate: null, payable: false, source: 'simulator' };
  }
}
