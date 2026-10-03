import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { git, project } from '../scripts/millennium/project.mjs';
import { createApplication } from './app.mjs';

const { values } = parseArgs({ options: { asaas: { type: 'boolean' }, port: { type: 'string', default: '4311' } } });
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Porta local invalida.');
const root = project(path.dirname(fileURLToPath(import.meta.url))).root;
try { git(root, 'check-ignore', '-q', '.payments-sandbox/simulator/state.json'); }
catch { throw new Error('Inclua .payments-sandbox/ no .gitignore antes de iniciar.'); }
const mode = values.asaas ? 'asaas' : 'simulator';
const { app } = createApplication({
  dataDir: path.join(root, '.payments-sandbox', mode), mode,
  key: values.asaas ? process.env.ASAAS_SANDBOX_API_KEY : undefined,
  customer: values.asaas ? process.env.ASAAS_SANDBOX_CUSTOMER_ID : undefined,
  webhookToken: values.asaas ? process.env.ASAAS_SANDBOX_WEBHOOK_TOKEN : undefined,
});
try {
  let address;
  try { address = await app.listen({ host: '127.0.0.1', port }); }
  catch (error) {
    if (error.code !== 'EADDRINUSE') throw error;
    address = await app.listen({ host: '127.0.0.1', port: 0 });
  }
  console.log(`Millennium Pix | ${mode === 'asaas' ? 'Asaas Sandbox' : 'Simulacao local, QR nao pagavel'} | ${address}`);
} catch (error) { await app.close(); throw error; }
let closing = false;
const shutdown = async () => { if (closing) return; closing = true; await app.close(); };
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown); process.on('SIGHUP', shutdown);
