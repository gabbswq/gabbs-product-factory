import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import { createApplication } from '../app.mjs';
import { Repository } from '../repository.mjs';
import { Simulator, AsaasSandbox, ProviderError, ASAAS_ORIGIN } from '../providers.mjs';
import { cents, providerCents, input, hash } from '../domain.mjs';

const host = '127.0.0.1:4311';
const token = 'fixture-webhook-token-not-a-real-secret';
const body = { description: 'Anomalia ficticia', amount: '10.01', dueDate: '2099-01-01' };

async function fixture(t, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'millennium-pix-test-'));
  let provider;
  if (options.providerFactory) {
    const seed = new Repository(path.join(dir, 'data'), 'simulator');
    provider = options.providerFactory(seed);
    seed.close();
  }
  const setup = createApplication({ dataDir: path.join(dir, 'data'), webhookToken: token, ...options, provider });
  if (provider) provider.repo = setup.repo;
  await setup.app.ready();
  const session = (await setup.app.inject({ url: '/api/session', headers: { host } })).json();
  const headers = { host, origin: `http://${host}`, 'x-millennium-csrf': session.csrf };
  const request = (method, url, payload, custom = {}) => setup.app.inject({ method, url, payload, headers: { ...headers, ...custom } });
  t.after(async () => {
    await setup.app.close();
    assert.equal(path.dirname(dir), os.tmpdir());
    assert.ok(path.basename(dir).startsWith('millennium-pix-test-'));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return { ...setup, dir, headers, request, session };
}

const create = (f, key = randomUUID(), value = body) => f.request('POST', '/api/charges', value, { 'idempotency-key': key });
const event = (charge, type = 'PAYMENT_RECEIVED', id = randomUUID()) => ({ id, event: type,
  payment: { id: charge.providerId, billingType: 'PIX', customer: 'cus_simulator', value: charge.amountCents / 100,
    externalReference: charge.id, status: type === 'PAYMENT_REFUNDED' ? 'REFUNDED' : type === 'PAYMENT_OVERDUE' ? 'OVERDUE' : type === 'PAYMENT_CONFIRMED' ? 'CONFIRMED' : 'RECEIVED' } });
const webhook = (f, payload, secret = token) => f.app.inject({ method: 'POST', url: '/webhooks/asaas', payload, headers: { host, 'asaas-access-token': secret } });

test('dinheiro decimal vira centavos sem aceitar expoente, arredondamento ou valor fora do limite', () => {
  for (const [value, expected] of [['0.01', 1], ['10,01', 1001], ['1.1', 110], ['10000', 1000000]]) assert.equal(cents(value), expected);
  for (const value of ['0', '-1', '1e3', '0.001', '10000.01', '', 2, null]) assert.throws(() => cents(value));
  assert.equal(providerCents(10.01), 1001);
  for (const value of [NaN, Infinity, '10', 0, 0.001]) assert.throws(() => providerCents(value));
});

test('cria cobranca e QR de simulacao explicitamente nao pagavel', async t => {
  const f = await fixture(t); const response = await create(f);
  assert.equal(response.statusCode, 201);
  const charge = response.json().charge;
  assert.equal(charge.amountCents, 1001); assert.equal(charge.status, 'PENDING');
  assert.equal(charge.qr.source, 'simulator'); assert.equal(charge.qr.payable, false);
  assert.ok(charge.qr.payload.startsWith('MILLENNIUM-SIMULATION:'));
  assert.ok(charge.qr.image.startsWith('data:image/png;base64,'));
  assert.equal('requestKey' in charge, false); assert.equal('requestHash' in charge, false);
});

test('same key com mesmo corpo retorna cobranca; outro corpo gera conflito', async t => {
  const f = await fixture(t); const key = randomUUID();
  const first = (await create(f, key)).json().charge;
  const repeat = await create(f, key);
  assert.equal(repeat.statusCode, 200); assert.equal(repeat.json().charge.id, first.id);
  assert.equal(repeat.json().replay, true);
  assert.equal((await create(f, key, { ...body, amount: '20' })).statusCode, 409);
  assert.equal(f.repo.state.charges.length, 1);
});

test('lista leve nao retransmite QR; detalhe selecionado preserva imagem e codigo', async t => {
  const f = await fixture(t); const charge = (await create(f)).json().charge;
  const list = (await f.request('GET', '/api/charges')).json();
  assert.equal('qr' in list.charges[0], false);
  const detail = (await f.request('GET', `/api/charges/${charge.id}`)).json();
  assert.deepEqual(detail.qr, charge.qr);
});

test('criacao concorrente reserva a chave antes de chamar o provedor', async t => {
  let release; let calls = 0;
  const gate = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, { providerFactory: repo => {
    const p = new Simulator(repo);
    p.create = async charge => { calls++; await gate; return p.remote(charge); };
    return p;
  } });
  const key = randomUUID();
  const first = create(f, key);
  while (!calls) await new Promise(resolve => setTimeout(resolve, 10));
  try {
    const duplicate = await create(f, key);
    assert.equal(duplicate.statusCode, 202); assert.equal(duplicate.json().charge.status, 'CREATING');
    assert.equal(calls, 1);
  } finally { release(); }
  assert.equal((await first).statusCode, 201);
});

test('replay de uma cobranca antiga funciona sem permitir nova criacao vencida', async t => {
  const f = await fixture(t); const key = randomUUID();
  const charge = (await create(f, key)).json().charge;
  const past = { ...body, dueDate: '2000-01-01' };
  f.repo.transact(state => {
    const record = state.charges[0]; record.dueDate = past.dueDate;
    record.requestHash = hash(input(past, { allowPast: true }));
  });
  const replay = await create(f, key, past);
  assert.equal(replay.statusCode, 200); assert.equal(replay.json().charge.id, charge.id);
  assert.equal((await create(f, randomUUID(), past)).statusCode, 400);
  assert.equal(f.repo.state.charges.length, 1);
});

test('validacao de entrada rejeita datas invalidas, passado, vazio e propriedades extras', async t => {
  const f = await fixture(t);
  for (const value of [{ ...body, description: ' ' }, { ...body, dueDate: '2026-02-30' },
    { ...body, dueDate: '2000-01-01' }, { ...body, amount: 10 }, { ...body, amount: '1e3' },
    { ...body, url: 'https://api.asaas.com' }, { amount: '1.00' }]) assert.equal((await create(f, randomUUID(), value)).statusCode, 400);
  assert.equal((await f.request('POST', '/api/charges', body)).statusCode, 400);
  assert.equal(f.repo.state.charges.length, 0);
});

test('CSRF, origem e Host protegem chamadas locais contra outro site e DNS rebinding', async t => {
  const f = await fixture(t);
  assert.equal((await f.app.inject({ url: '/api/session', headers: { host: 'evil.example:4311' } })).statusCode, 403);
  assert.equal((await f.app.inject({ url: '/api/session', headers: { host, 'sec-fetch-site': 'cross-site' } })).statusCode, 403);
  for (const custom of [{ origin: 'https://evil.example' }, { 'x-millennium-csrf': '' }, { origin: undefined }]) {
    const headers = { ...f.headers, ...custom, 'idempotency-key': randomUUID() };
    for (const key of Object.keys(headers)) if (headers[key] === undefined) delete headers[key];
    assert.equal((await f.app.inject({ method: 'POST', url: '/api/charges', payload: body, headers })).statusCode, 403);
  }
  assert.equal(f.repo.state.charges.length, 0);
});

test('corpo excessivo, JSON quebrado e tipo errado falham sem criar registros', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('POST', '/api/charges', 'x'.repeat(40000), { 'content-type': 'application/json' })).statusCode, 413);
  const invalid = await f.request('POST', '/api/charges', '{broken', { 'content-type': 'application/json' });
  assert.equal(invalid.statusCode, 400);
  assert.equal((await f.request('POST', '/api/charges', 'plain', { 'content-type': 'text/plain' })).statusCode, 400);
  assert.equal(f.repo.state.charges.length, 0);
});

test('timeout de criacao fica incerto e replay nao repete POST', async t => {
  let calls = 0;
  const f = await fixture(t, { providerFactory: repo => {
    const p = new Simulator(repo); p.create = async () => { calls++; throw new ProviderError('timeout', true); }; return p;
  } });
  const key = randomUUID(); const first = await create(f, key);
  assert.equal(first.statusCode, 202); assert.equal(first.json().charge.status, 'UNCERTAIN');
  await create(f, key); assert.equal(calls, 1);
  assert.equal((await create(f, randomUUID())).statusCode, 409);
  const check = await f.request('POST', `/api/charges/${first.json().charge.id}/reconcile`, {});
  assert.equal(check.statusCode, 409); assert.equal(calls, 1);
});

test('recusa definitiva de criacao fica rejeitada sem revelar erro bruto', async t => {
  const f = await fixture(t, { providerFactory: repo => {
    const p = new Simulator(repo); p.create = async () => { throw new ProviderError(401, false); }; return p;
  } });
  const response = await create(f); assert.equal(response.statusCode, 422);
  assert.equal(response.json().charge.status, 'REJECTED');
});

test('webhook valido resolve criacao incerta e remove aviso de ambiguidade', async t => {
  const f = await fixture(t, { providerFactory: repo => {
    const p = new Simulator(repo); p.create = async () => { throw new ProviderError('timeout', true); }; return p;
  } });
  const charge = (await create(f)).json().charge;
  const payload = event({ ...charge, providerId: `sim_${charge.id}` });
  assert.equal((await webhook(f, payload)).statusCode, 200);
  assert.equal(f.payments.charge(charge.id).status, 'RECEIVED');
  assert.equal(f.payments.charge(charge.id).warning, null);
  assert.equal(f.repo.state.charges.length, 1);
});

test('QR indisponivel preserva cobranca; conciliar tenta QR sem criar novamente', async t => {
  let calls = 0; let broken = true;
  const f = await fixture(t, { providerFactory: repo => {
    const p = new Simulator(repo); const original = p.qr.bind(p);
    p.create = async charge => { calls++; return p.remote(charge); };
    p.qr = async id => { if (broken) throw new Error('private-provider-error'); return original(id); }; return p;
  } });
  const charge = (await create(f)).json().charge;
  assert.equal(charge.status, 'PENDING'); assert.equal(charge.qr, null);
  assert.match(charge.warning, /QR indisponivel/); assert.doesNotMatch(charge.warning, /private/);
  broken = false;
  assert.ok((await f.request('POST', `/api/charges/${charge.id}/reconcile`, {})).json().charge.qr);
  assert.equal(calls, 1);
});

test('webhook autentica antes de processar e nao aceita evento desconhecido como recebido', async t => {
  const f = await fixture(t); const charge = (await create(f)).json().charge;
  for (const secret of ['', 'wrong']) assert.equal((await webhook(f, event(charge), secret)).statusCode, 401);
  assert.equal(f.repo.state.events.length, 0);
  const ignored = await webhook(f, { id: 'evt_other', event: 'SUBSCRIPTION_CREATED' });
  assert.equal(ignored.statusCode, 200); assert.equal(ignored.json().disposition, 'ignored');
  assert.equal(f.payments.charge(charge.id).status, 'PENDING');
});

test('webhook recebido e idempotente; ID com outro conteudo gera conflito', async t => {
  const f = await fixture(t); const charge = (await create(f)).json().charge;
  const payload = event(charge, 'PAYMENT_RECEIVED', 'evt_same');
  assert.equal((await webhook(f, payload)).statusCode, 200);
  assert.equal((await webhook(f, payload)).json().duplicate, true);
  assert.equal((await webhook(f, { ...payload, event: 'PAYMENT_REFUNDED', payment: { ...payload.payment, status: 'REFUNDED' } })).statusCode, 409);
  assert.equal(f.repo.state.events.length, 1);
  assert.equal(f.payments.charge(charge.id).status, 'RECEIVED');
});

test('webhook rejeita ID, metodo, cliente, referencia e valor divergentes', async t => {
  const f = await fixture(t); const charge = (await create(f)).json().charge;
  for (const change of [{ id: 'pay_unknown' }, { billingType: 'CREDIT_CARD' }, { customer: 'cus_other' },
    { externalReference: 'other' }, { value: 20 }, { value: 0.001 }, { status: 'PENDING' }]) {
    const payload = event(charge); Object.assign(payload.payment, change);
    assert.ok([409, 502].includes((await webhook(f, payload)).statusCode));
  }
  assert.equal(f.payments.charge(charge.id).status, 'PENDING'); assert.equal(f.repo.state.events.length, 0);
});

test('CONFIRMED nao e RECEIVED; evento vencido antigo nao regride recebido ou estornado', async t => {
  const f = await fixture(t); const charge = (await create(f)).json().charge;
  await webhook(f, event(charge, 'PAYMENT_CONFIRMED'));
  assert.equal(f.payments.charge(charge.id).status, 'CONFIRMED');
  assert.equal((await f.request('GET', '/api/charges')).json().summary.receivedCents, 0);
  await webhook(f, event(charge)); await webhook(f, event(charge, 'PAYMENT_OVERDUE'));
  assert.equal(f.payments.charge(charge.id).status, 'RECEIVED');
  await webhook(f, event(charge, 'PAYMENT_REFUNDED')); await webhook(f, event(charge));
  assert.equal(f.payments.charge(charge.id).status, 'REFUNDED');
  assert.equal((await f.request('GET', '/api/charges')).json().summary.receivedCents, 0);
});

test('simulacao altera fonte e conciliacao preserva resultado; eventos ficam visiveis', async t => {
  const f = await fixture(t); const charge = (await create(f)).json().charge;
  const response = await f.request('POST', `/api/charges/${charge.id}/simulate`, { event: 'PAYMENT_RECEIVED' });
  assert.equal(response.statusCode, 200); assert.equal(response.json().charge.status, 'RECEIVED');
  assert.equal((await f.request('POST', `/api/charges/${charge.id}/reconcile`, {})).json().charge.status, 'RECEIVED');
  const list = (await f.request('GET', '/api/charges')).json();
  assert.equal(list.summary.receivedCents, 1001); assert.equal(list.events.length, 1);
  assert.equal((await f.request('POST', `/api/charges/${charge.id}/simulate`, { event: 'PAYMENT_OVERDUE' })).statusCode, 409);
});

test('registro persistido reabre sem perder cobranças ou liberar duas instancias', async t => {
  const f = await fixture(t); const charge = (await create(f)).json().charge;
  assert.throws(() => new Repository(path.join(f.dir, 'data'), 'simulator'), /ja aberto/);
  await f.app.close();
  const reopened = new Repository(path.join(f.dir, 'data'), 'simulator');
  try { assert.equal(reopened.state.charges[0].id, charge.id); }
  finally { reopened.close(); }
});

test('estado CREATING interrompido vira UNCERTAIN sem repetir criacao', async t => {
  const f = await fixture(t); const charge = (await create(f)).json().charge;
  f.repo.transact(state => { state.charges[0].status = 'CREATING'; });
  await f.app.close();
  const reopened = new Repository(path.join(f.dir, 'data'), 'simulator');
  try { assert.equal(reopened.state.charges[0].id, charge.id); assert.equal(reopened.state.charges[0].status, 'UNCERTAIN'); }
  finally { reopened.close(); }
});

test('dados corrompidos e links simbolicos nao sao sobrescritos', async t => {
  const f = await fixture(t); await f.app.close();
  const file = path.join(f.dir, 'data', 'state.json'); fs.writeFileSync(file, '{broken');
  assert.throws(() => new Repository(path.join(f.dir, 'data'), 'simulator'));
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
  const linked = path.join(f.dir, 'linked'); fs.symlinkSync(path.join(f.dir, 'data'), linked);
  assert.throws(() => new Repository(linked, 'simulator'), /links/);
});

test('recupera lock morto; recuperacao simultanea ou interrompida falha fechada', async t => {
  const f = await fixture(t); await f.app.close();
  const dataDir = path.join(f.dir, 'data'); const lockFile = path.join(dataDir, 'server.lock');
  const stale = JSON.stringify({ pid: 2147483647, identity: 'dead-fixture', token: randomUUID() });
  fs.writeFileSync(lockFile, stale);
  const reopened = new Repository(dataDir, 'simulator'); reopened.close();
  assert.equal(fs.existsSync(`${lockFile}.recovery`), false);
  fs.writeFileSync(lockFile, stale); fs.writeFileSync(`${lockFile}.recovery`, 'held-by-other-recovery');
  assert.throws(() => new Repository(dataDir, 'simulator'), /Recuperacao/);
  assert.equal(fs.readFileSync(lockFile, 'utf8'), stale);
  assert.equal(fs.readFileSync(`${lockFile}.recovery`, 'utf8'), 'held-by-other-recovery');
});

test('Asaas usa apenas origin sandbox, sem seguir redirect, e nao envia dados de cartao', async () => {
  const calls = [];
  const provider = new AsaasSandbox({ key: 'sandbox-fixture-key', customer: 'cus_fixture', fetchFn: async (url, options) => {
    calls.push({ url, options }); return { ok: true, json: async () => ({ id: 'pay_fixture' }) };
  } });
  await provider.create({ id: 'local-id', amountCents: 1001, dueDate: body.dueDate, description: body.description });
  const call = calls[0]; assert.equal(call.url, `${ASAAS_ORIGIN}/payments`); assert.equal(call.options.redirect, 'error');
  assert.equal(call.options.headers['User-Agent'], 'Millennium-Pix-Sandbox/0.1.0');
  assert.deepEqual(JSON.parse(call.options.body), { customer: 'cus_fixture', billingType: 'PIX', value: 10.01,
    dueDate: body.dueDate, description: body.description, externalReference: 'local-id' });
  assert.throws(() => new AsaasSandbox({ key: '$aact_prod_secret', customer: 'cus_fixture' }), /Sandbox/);
  assert.throws(() => new AsaasSandbox({ key: 'sandbox-fixture-key', customer: '../bad' }), /CUSTOMER/);
});

test('Asaas rejeita redirect, erro HTTP, resposta quebrada e QR nao PNG', async () => {
  for (const result of [{ ok: false, status: 302 }, { ok: false, status: 408 }, { ok: false, status: 500 }, { ok: true, json: async () => { throw new Error('raw-secret'); } }]) {
    const provider = new AsaasSandbox({ key: 'sandbox-fixture-key', customer: 'cus_fixture', fetchFn: async () => result });
    await assert.rejects(() => provider.get('pay_test'), error => !error.message.includes('raw-secret') && error.uncertain);
  }
  const provider = new AsaasSandbox({ key: 'sandbox-fixture-key', customer: 'cus_fixture', fetchFn: async () => ({ ok: true, json: async () => ({ encodedImage: 'not-png', payload: 'fake' }) }) });
  await assert.rejects(() => provider.qr('pay_test'), /QR/);
  assert.throws(() => provider.get('../credentials'), /ID/);
});

test('Asaas contrato completo com fixture e sem rede: criacao, QR e consulta', async t => {
  const image = (await QRCode.toBuffer('PROVIDER-FIXTURE-NOT-PAYABLE')).toString('base64');
  let remote; let posts = 0;
  const calls = [];
  const f = await fixture(t, { mode: 'asaas', key: 'sandbox-fixture-key', customer: 'cus_fixture', fetchFn: async (url, options) => {
    calls.push(url);
    if (options.method === 'POST') { posts++; remote = { id: 'pay_fixture', ...JSON.parse(options.body), status: 'PENDING' }; return { ok: true, json: async () => remote }; }
    return { ok: true, json: async () => url.endsWith('/pixQrCode') ? { encodedImage: image, payload: 'PROVIDER-FIXTURE-NOT-PAYABLE' } : remote };
  } });
  const charge = (await create(f)).json().charge;
  assert.equal(charge.qr.source, 'asaas-sandbox'); assert.equal(charge.status, 'PENDING');
  remote.status = 'RECEIVED';
  assert.equal((await f.request('POST', `/api/charges/${charge.id}/reconcile`, {})).json().charge.status, 'RECEIVED');
  assert.equal(posts, 1); assert.ok(calls.every(url => url.startsWith(ASAAS_ORIGIN + '/')));
  assert.equal((await f.request('POST', `/api/charges/${charge.id}/simulate`, { event: 'PAYMENT_RECEIVED' })).statusCode, 403);
  const output = JSON.stringify((await f.request('GET', '/api/charges')).json()) + JSON.stringify(f.session);
  assert.doesNotMatch(output, /sandbox-fixture-key|fixture-webhook-token/);
});

test('criacao ambigua concilia por referencia sem repetir POST', async t => {
  let remote; let posts = 0;
  const f = await fixture(t, { mode: 'asaas', key: 'sandbox-fixture-key', customer: 'cus_fixture', fetchFn: async (url, options) => {
    if (options.method === 'POST') { posts++; remote = { id: 'pay_late', ...JSON.parse(options.body), status: 'RECEIVED' }; throw new Error('network-lost'); }
    assert.ok(url.includes('externalReference='));
    return { ok: true, json: async () => ({ data: [remote], hasMore: false }) };
  } });
  const key = randomUUID(); const charge = (await create(f, key)).json().charge;
  assert.equal(charge.status, 'UNCERTAIN'); await create(f, key);
  const reconciled = await f.request('POST', `/api/charges/${charge.id}/reconcile`, {});
  assert.equal(reconciled.statusCode, 200); assert.equal(reconciled.json().charge.providerId, 'pay_late');
  assert.equal(reconciled.json().charge.status, 'RECEIVED'); assert.equal(posts, 1);
});

test('referencia ambigua nao vira pagamento aceito', async t => {
  let remote;
  const f = await fixture(t, { mode: 'asaas', key: 'sandbox-fixture-key', customer: 'cus_fixture', fetchFn: async (url, options) => {
    if (options.method === 'POST') { remote = { id: 'pay_late', ...JSON.parse(options.body), status: 'RECEIVED' }; throw new Error('timeout'); }
    return { ok: true, json: async () => ({ data: [remote, { ...remote, id: 'pay_another' }], hasMore: false }) };
  } });
  const charge = (await create(f)).json().charge;
  assert.equal((await f.request('POST', `/api/charges/${charge.id}/reconcile`, {})).statusCode, 409);
  assert.equal(f.payments.charge(charge.id).status, 'UNCERTAIN');
});

test('consulta com valor divergente nao confirma cobranca incerta', async t => {
  let remote;
  const f = await fixture(t, { mode: 'asaas', key: 'sandbox-fixture-key', customer: 'cus_fixture', fetchFn: async (url, options) => {
    if (options.method === 'POST') { remote = { id: 'pay_late', ...JSON.parse(options.body), value: 99, status: 'RECEIVED' }; throw new Error('timeout'); }
    return { ok: true, json: async () => ({ data: [remote], hasMore: false }) };
  } });
  const charge = (await create(f)).json().charge;
  assert.equal((await f.request('POST', `/api/charges/${charge.id}/reconcile`, {})).statusCode, 502);
  assert.equal(f.payments.charge(charge.id).status, 'UNCERTAIN');
  assert.equal(f.repo.state.charges[0].providerId, null);
});

test('chave da API nao serve como token de webhook e falha libera o lock', async t => {
  const f = await fixture(t); await f.app.close();
  const dataDir = path.join(f.dir, 'asaas');
  assert.throws(() => createApplication({ dataDir, mode: 'asaas', key: token, customer: 'cus_fixture', webhookToken: token }), /diferente/);
  const repo = new Repository(dataDir, 'asaas'); repo.close();
});
