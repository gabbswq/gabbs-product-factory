import { LabError } from './domain.mjs';

export function configureHttp(app) {
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  });
  app.setErrorHandler((error, request, reply) => {
    const status = error instanceof LabError ? error.status : error.validation || error.statusCode === 400 ? 400 : error.statusCode === 413 ? 413 : error.statusCode === 415 ? 415 : 500;
    reply.code(status).send({ error: error instanceof LabError ? error.message : status === 400 ? 'Campos invalidos na requisicao.' : status === 413 ? 'Requisicao acima do limite local.' : status === 415 ? 'Use application/json.' : 'Falha interna. Os registros de teste foram preservados.' });
  });
  app.setNotFoundHandler((request, reply) => reply.code(404).send({ error: 'Recurso nao encontrado.' }));
}

export function registerWebhook(app, payments) {
  app.post('/webhooks/asaas', {
    onRequest: async request => payments.authorizeWebhook(request.headers['asaas-access-token']),
    schema: { body: { type: 'object', required: ['id', 'event'], properties: {
      id: { type: 'string', minLength: 1, maxLength: 150 },
      event: { type: 'string', minLength: 1, maxLength: 100 }, payment: { type: 'object' },
    } } },
  }, async request => payments.webhook(request.body, request.headers['asaas-access-token']));
}
