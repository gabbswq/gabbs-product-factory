import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { request as httpRequest, createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { createApplication } from '../app.mjs';
import { createWebhookReceiver } from '../webhook-receiver.mjs';
import { Repository } from '../repository.mjs';

const host = '127.0.0.1:4311';
const token = 'receiver-fixture-token-not-a-real-secret';
const key = 'sandbox-fixture-key-not-a-real-secret';

function rawRequest(url, { method = 'GET', headers = {}, payload } = {}) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(url, { method, headers, agent: false }, response => {
      let body = ''; response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; }); response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode, body }));
    });
    request.on('error', reject); request.end(payload);
  });
}

async function fixture(t, { mode = 'asaas', receiver = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'millennium-receiver-test-'));
  const image = (await QRCode.toBuffer('RECEIVER-FIXTURE-NOT-PAYABLE')).toString('base64');
  const calls = []; let remote;
  const lab = createApplication({ dataDir: dir, mode, key, customer: 'cus_fixture', webhookToken: token,
    fetchFn: async (url, options) => {
      calls.push(url);
      if (options.method === 'POST') remote = { ...JSON.parse(options.body), id: 'pay_fixture', status: 'PENDING' };
      return { ok: true, json: async () => url.endsWith('/pixQrCode') ? { encodedImage: image, payload: 'RECEIVER-FIXTURE-NOT-PAYABLE' } : remote };
    },
  });
  const endpoint = receiver ? createWebhookReceiver(lab) : null;
  await lab.app.ready(); if (endpoint) await endpoint.ready();
  const session = (await lab.app.inject({ url: '/api/session', headers: { host } })).json();
  t.after(async () => {
    await lab.app.close();
    assert.equal(path.dirname(dir), os.tmpdir());
    assert.ok(path.basename(dir).startsWith('millennium-receiver-test-'));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const create = async () => {
    const response = await lab.app.inject({ method: 'POST', url: '/api/charges',
      headers: { host, origin: `http://${host}`, 'x-millennium-csrf': session.csrf, 'idempotency-key': randomUUID() },
      payload: { description: 'Pedido ficticio externo', amount: '10.01', dueDate: '2099-01-01' },
    });
    assert.equal(response.statusCode, 201); return response.json().charge;
  };
  const deliver = (payload, headers = {}) => endpoint.inject({ method: 'POST', url: '/webhooks/asaas', payload,
    headers: { host: 'public.fixture.invalid', 'asaas-access-token': token, ...headers } });
  return { ...lab, receiver: endpoint, dir, calls, create, deliver };
}

const event = charge => ({ id: `evt_${randomUUID()}`, event: 'PAYMENT_RECEIVED',
  payment: { id: charge.providerId, billingType: 'PIX', customer: 'cus_fixture',
    value: charge.amountCents / 100, externalReference: charge.id, status: 'RECEIVED' } });

test('receptor aceita Host de tunnel apenas no webhook, persiste antes de 200 e deduplica', async t => {
  const f = await fixture(t); const charge = await f.create(); const payload = event(charge);
  const calls = f.calls.length;
  const first = await f.deliver(payload);
  assert.equal(first.statusCode, 200); assert.equal(first.json().disposition, 'applied');
  const persisted = JSON.parse(fs.readFileSync(path.join(f.dir, 'state.json'), 'utf8'));
  assert.equal(persisted.charges[0].status, 'RECEIVED'); assert.equal(persisted.events.length, 1);
  assert.equal((await f.deliver(payload)).json().duplicate, true);
  assert.equal(f.repo.state.events.length, 1); assert.equal(f.calls.length, calls);
  assert.doesNotMatch(first.body + JSON.stringify(persisted), /sandbox-fixture-key|receiver-fixture-token/);
});

test('receptor nao serve painel, sessao, assets, cobrancas nem outros metodos', async t => {
  const f = await fixture(t);
  for (const url of ['/', '/api/session', '/api/charges', '/app.js', '/style.css', '/webhooks/asaas']) {
    const response = await f.receiver.inject({ url, headers: { host: 'public.fixture.invalid' } });
    assert.equal(response.statusCode, 404); assert.deepEqual(response.json(), { error: 'Recurso nao encontrado.' });
    assert.equal(response.headers['access-control-allow-origin'], undefined);
  }
  for (const [method, url] of [['POST', '/api/charges'], ['DELETE', '/webhooks/asaas'], ['OPTIONS', '/webhooks/asaas']]) {
    assert.equal((await f.receiver.inject({ method, url, payload: {}, headers: { 'asaas-access-token': token } })).statusCode, 404);
  }
  assert.equal(f.repo.state.charges.length, 0); assert.equal(f.repo.state.events.length, 0);
});

test('token e validado antes do JSON; API key e eventos de navegador nao autenticam', async t => {
  const f = await fixture(t);
  for (const secret of ['', 'wrong', key]) {
    const response = await f.deliver('{broken', { 'content-type': 'application/json', 'asaas-access-token': secret });
    assert.equal(response.statusCode, 401);
  }
  assert.equal((await f.deliver('{broken', { 'content-type': 'application/json' })).statusCode, 400);
  assert.equal((await f.deliver({}, { origin: 'https://public.fixture.invalid' })).statusCode, 403);
  assert.equal((await f.deliver({}, { 'sec-fetch-site': 'cross-site' })).statusCode, 403);
  assert.equal(f.repo.state.events.length, 0);
});

test('receptor limita corpo e valida schema sem converter tipos ou revelar entrada', async t => {
  const f = await fixture(t);
  assert.equal((await f.deliver('x'.repeat(40000), { 'content-type': 'application/json' })).statusCode, 413);
  assert.equal((await f.deliver('plain', { 'content-type': 'application/octet-stream' })).statusCode, 415);
  for (const payload of [{ id: 1, event: 'PAYMENT_RECEIVED' }, { id: 'evt_x', event: 2 }, { event: 'PAYMENT_RECEIVED' }]) {
    assert.equal((await f.deliver(payload)).statusCode, 400);
  }
  assert.equal(f.repo.state.events.length, 0);
});

test('dados de pagamento divergentes no receptor nao alteram o registro', async t => {
  const f = await fixture(t); const charge = await f.create();
  const payload = event(charge); payload.payment.value = 99;
  assert.equal((await f.deliver(payload)).statusCode, 502);
  assert.equal(f.repo.state.charges[0].status, 'PENDING'); assert.equal(f.repo.state.events.length, 0);
});

test('falha de persistencia nao responde 200 nem perde direito de retry do evento', async t => {
  const f = await fixture(t); const charge = await f.create(); const payload = event(charge);
  const save = f.repo.save;
  f.repo.save = () => { throw new Error('private-fixture-disk-error'); };
  try {
    const response = await f.deliver(payload);
    assert.equal(response.statusCode, 500); assert.doesNotMatch(response.body, /private-fixture/);
    assert.equal(f.repo.state.events.length, 0); assert.equal(f.repo.state.charges[0].status, 'PENDING');
  } finally { f.repo.save = save; }
  assert.equal((await f.deliver(payload)).statusCode, 200);
  assert.equal(f.repo.state.events.length, 1);
});

test('dois listeners TCP compartilham estado sem relaxar Host ou CSRF do painel', async t => {
  const f = await fixture(t); const charge = await f.create();
  const local = await f.app.listen({ host: '127.0.0.1', port: 0 });
  const external = await f.receiver.listen({ host: '127.0.0.1', port: 0 });
  const response = await rawRequest(`${external}/webhooks/asaas`, { method: 'POST', headers: {
    host: 'public.fixture.invalid', 'content-type': 'application/json', 'asaas-access-token': token,
  }, payload: JSON.stringify(event(charge)) });
  assert.equal(response.status, 200);
  assert.equal((await fetch(`${external}/api/session`)).status, 404);
  assert.equal((await rawRequest(`${local}/api/session`, { headers: { host: 'public.fixture.invalid', 'x-forwarded-host': new URL(local).host } })).status, 403);
  assert.equal((await fetch(`${local}/api/charges`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 403);
  const result = await (await fetch(`${local}/api/charges`)).json();
  assert.equal(result.charges[0].status, 'RECEIVED'); assert.equal(result.events.length, 1);
});

test('fechamento do painel drena webhook ativo antes de liberar lock e fecha receptor', async t => {
  const f = await fixture(t); const charge = await f.create();
  const external = await f.receiver.listen({ host: '127.0.0.1', port: 0 });
  let release, started;
  const gate = new Promise(resolve => { release = resolve; });
  const entered = new Promise(resolve => { started = resolve; });
  const original = f.payments.webhook.bind(f.payments);
  f.payments.webhook = async (...args) => { started(); await gate; return original(...args); };
  const incoming = fetch(`${external}/webhooks/asaas`, { method: 'POST', headers: {
    'content-type': 'application/json', 'asaas-access-token': token,
  }, body: JSON.stringify(event(charge)) });
  await entered;
  const closing = f.app.close();
  try {
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(fs.existsSync(path.join(f.dir, 'server.lock')), true);
    assert.throws(() => new Repository(f.dir, 'asaas'), /ja aberto/);
  } finally { release(); }
  assert.equal((await incoming).status, 200); await closing;
  assert.equal(f.receiver.server.listening, false);
  assert.equal(fs.existsSync(path.join(f.dir, 'server.lock')), false);
  const reopened = new Repository(f.dir, 'asaas');
  try { assert.equal(reopened.state.events.length, 1); }
  finally { reopened.close(); }
});

test('simulador nao permite receptor; CLI rejeita ativacao implicita e portas conflitantes', async t => {
  const f = await fixture(t, { mode: 'simulator', receiver: false });
  assert.throws(() => createWebhookReceiver(f), /Asaas Sandbox/);
  const server = fileURLToPath(new URL('../server.mjs', import.meta.url));
  for (const args of [['--webhook-port', '4312'], ['--asaas', '--webhook-port', 'invalid'], ['--asaas', '--port', '4311', '--webhook-port', '4311']]) {
    const result = spawnSync(process.execPath, [server, ...args], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 1); assert.match(result.stderr, /Porta de webhook exige/);
  }
});

test('porta de webhook ocupada falha sem fallback e preserva o outro servidor', async t => {
  const f = await fixture(t);
  const blocker = createServer((request, reply) => reply.end('occupied-fixture'));
  await new Promise(resolve => blocker.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => blocker.close(resolve)));
  const port = blocker.address().port;
  await assert.rejects(() => f.receiver.listen({ port, host: '127.0.0.1' }), { code: 'EADDRINUSE' });
  await f.app.close();
  assert.equal(blocker.listening, true);
  assert.equal((await rawRequest(`http://127.0.0.1:${port}`)).body, 'occupied-fixture');
  assert.equal(fs.existsSync(path.join(f.dir, 'server.lock')), false);
});
