import Fastify from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Repository } from './repository.mjs';
import { Simulator, AsaasSandbox } from './providers.mjs';
import { Payments } from './service.mjs';
import { LabError, dto, today } from './domain.mjs';
import { configureHttp, registerWebhook } from './http.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const emptyBody = { type: 'object', additionalProperties: false, properties: {} };
const chargeBody = {
  type: 'object', additionalProperties: false, required: ['description', 'amount', 'dueDate'],
  properties: { description: { type: 'string', minLength: 1, maxLength: 200 },
    amount: { type: 'string', minLength: 1, maxLength: 8 }, dueDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } },
};
const chargeParams = { type: 'object', required: ['id'], properties: { id: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,100}$' } } };

function matches(given, expected) {
  const left = Buffer.from(typeof given === 'string' ? given : '');
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createApplication({ dataDir, mode = 'simulator', provider, key, customer, webhookToken, fetchFn, assetsDir = path.join(directory, 'dist') }) {
  const token = webhookToken ?? (mode === 'simulator' ? randomBytes(32).toString('hex') : null);
  const repo = new Repository(dataDir, mode);
  let payments;
  try {
    const adapter = provider ?? (mode === 'simulator' ? new Simulator(repo) : new AsaasSandbox({ key, customer, fetchFn }));
    if (adapter.mode !== mode) throw new Error('Provedor e armazenamento nao podem misturar modos.');
    if (mode === 'asaas' && token === adapter.key) throw new Error('Token de webhook deve ser diferente da chave da API.');
    payments = new Payments(repo, adapter, token);
  } catch (error) { repo.close(); throw error; }
  const csrf = randomBytes(32).toString('hex');
  const app = Fastify({ logger: false, bodyLimit: 32768, requestTimeout: 15000,
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } } });
  configureHttp(app);

  app.addHook('onClose', async () => repo.close());
  app.addHook('onRequest', async (request, reply) => {
    const host = request.headers.host;
    if (!/^127\.0\.0\.1:\d{1,5}$/.test(host ?? '') ||
        request.headers.origin && request.headers.origin !== `http://${host}` ||
        request.headers['sec-fetch-site'] === 'cross-site') throw new LabError(403, 'Origem local obrigatoria.');
    const webhook = request.routeOptions.url === '/webhooks/asaas';
    if (!['GET', 'HEAD'].includes(request.method) && !webhook &&
        (request.headers.origin !== `http://${host}` || !matches(request.headers['x-millennium-csrf'], csrf))) {
      throw new LabError(403, 'Sessao local invalida. Recarregue a pagina.');
    }
  });

  const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'] };
  for (const [route, [name, type]] of Object.entries(files)) {
    app.get(route, async (request, reply) => {
      try { return reply.type(type).send(fs.readFileSync(path.join(assetsDir, name))); }
      catch { return reply.code(503).send({ error: 'Tela nao compilada. Execute npm --prefix payments-sandbox run build.' }); }
    });
  }
  app.get('/api/session', async () => ({ csrf, mode, today: today(), seller: { id: 'seller-demo', name: 'Loja de teste' } }));
  app.get('/api/charges', async () => ({
    mode, charges: repo.state.charges.slice().reverse().map(charge => {
      const { qr, ...record } = dto(charge); return record;
    }),
    events: repo.state.events.slice(-100).reverse().map(({ fingerprint, ...event }) => event),
    summary: {
      count: repo.state.charges.length,
      pendingCents: repo.state.charges.filter(c => ['PENDING', 'OVERDUE'].includes(c.status)).reduce((sum, c) => sum + c.amountCents, 0),
      receivedCents: repo.state.charges.filter(c => c.status === 'RECEIVED').reduce((sum, c) => sum + c.amountCents, 0),
    },
  }));
  app.get('/api/charges/:id', { schema: { params: chargeParams } }, async request => dto(payments.charge(request.params.id)));
  app.post('/api/charges', { schema: { body: chargeBody } }, async (request, reply) => {
    const result = await payments.create(request.body, request.headers['idempotency-key']);
    const status = ['CREATING', 'UNCERTAIN'].includes(result.charge.status) ? 202 : result.charge.status === 'REJECTED' ? 422 : result.replay ? 200 : 201;
    return reply.code(status).send(result);
  });
  app.post('/api/charges/:id/reconcile', { schema: { params: chargeParams, body: emptyBody } }, async request => ({ charge: await payments.reconcile(request.params.id) }));
  app.post('/api/charges/:id/simulate', { schema: { params: chargeParams, body: { type: 'object', required: ['event'], additionalProperties: false, properties: { event: { type: 'string', enum: ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_OVERDUE', 'PAYMENT_REFUNDED', 'PAYMENT_DELETED'] } } } } },
    async request => payments.simulate(request.params.id, request.body.event));
  registerWebhook(app, payments);
  return { app, repo, payments };
}
