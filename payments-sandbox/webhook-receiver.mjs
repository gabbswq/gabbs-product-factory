import Fastify from 'fastify';
import { LabError } from './domain.mjs';
import { configureHttp, registerWebhook } from './http.mjs';

export function createWebhookReceiver({ app: owner, payments }) {
  if (payments.provider.mode !== 'asaas') throw new Error('Receptor separado exige Asaas Sandbox; nao exponha o simulador.');
  const receiver = Fastify({ logger: false, trustProxy: false, bodyLimit: 32768,
    requestTimeout: 15000, connectionTimeout: 15000, keepAliveTimeout: 5000,
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } } });
  configureHttp(receiver);
  receiver.addHook('onRequest', async (request, reply) => {
    reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    if (request.headers.origin || request.headers['sec-fetch-site'] === 'cross-site') {
      throw new LabError(403, 'Receptor exclusivo para eventos servidor a servidor.');
    }
  });
  registerWebhook(receiver, payments);
  // Drain incoming events before the owner releases its repository lock.
  owner.addHook('preClose', async () => receiver.close());
  return receiver;
}
