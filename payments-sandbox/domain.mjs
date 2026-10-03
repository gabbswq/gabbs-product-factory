import { createHash } from 'node:crypto';

export class LabError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const idPattern = /^[a-zA-Z0-9_-]{1,100}$/;
export const statuses = new Set(['CREATING', 'UNCERTAIN', 'REJECTED', 'PENDING', 'CONFIRMED', 'RECEIVED', 'OVERDUE', 'REFUNDED', 'CANCELED']);
export const events = {
  PAYMENT_CREATED: 'PENDING', PAYMENT_CONFIRMED: 'CONFIRMED',
  PAYMENT_RECEIVED: 'RECEIVED', PAYMENT_OVERDUE: 'OVERDUE',
  PAYMENT_REFUNDED: 'REFUNDED', PAYMENT_DELETED: 'CANCELED',
};

export function cents(value) {
  if (typeof value !== 'string' || !/^\d{1,5}(?:[.,]\d{1,2})?$/.test(value)) {
    throw new LabError(400, 'Informe um valor com ate duas casas decimais.');
  }
  const [whole, fraction = ''] = value.replace(',', '.').split('.');
  const amount = Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')));
  if (amount < 1 || amount > 1_000_000) throw new LabError(400, 'Valor de teste deve estar entre R$ 0,01 e R$ 10.000,00.');
  return amount;
}

export function providerCents(value) {
  const amount = typeof value === 'number' ? Math.round(value * 100) : NaN;
  if (!Number.isSafeInteger(amount) || amount < 1 || Math.abs(value * 100 - amount) > 0.000001) {
    throw new LabError(502, 'Valor inconsistente no provedor.');
  }
  return amount;
}

export function today() {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function input(body, { allowPast = false } = {}) {
  if (typeof body.description !== 'string' || !body.description.trim() || body.description.length > 200) {
    throw new LabError(400, 'Descricao obrigatoria, com ate 200 caracteres.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate ?? '') ||
      !Number.isFinite(Date.parse(`${body.dueDate}T00:00:00Z`)) ||
      new Date(`${body.dueDate}T00:00:00Z`).toISOString().slice(0, 10) !== body.dueDate || !allowPast && body.dueDate < today()) {
    throw new LabError(400, 'Vencimento deve ser uma data valida, a partir de hoje.');
  }
  return { sellerId: 'seller-demo', description: body.description.trim(), amountCents: cents(body.amount), dueDate: body.dueDate };
}

export const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function remoteStatus(remote) {
  if (remote.deleted === true) return 'CANCELED';
  if (!['PENDING', 'CONFIRMED', 'RECEIVED', 'OVERDUE', 'REFUNDED'].includes(remote.status)) {
    throw new LabError(502, 'Estado do provedor ainda nao suportado; conferir a conciliacao.');
  }
  return remote.status;
}

export function assertRemote(charge, remote, customer) {
  if (!idPattern.test(remote?.id ?? '') || remote.billingType !== 'PIX' || remote.customer !== customer ||
      remote.externalReference !== charge.id || providerCents(remote.value) !== charge.amountCents ||
      (charge.providerId && remote.id !== charge.providerId)) {
    throw new LabError(502, 'Dados da cobranca divergem do registro local.');
  }
}

export function nextStatus(current, next) {
  if (['REFUNDED', 'CANCELED'].includes(current) && next !== current) return current;
  if (current === 'RECEIVED' && !['RECEIVED', 'REFUNDED'].includes(next)) return current;
  if (current === 'CONFIRMED' && ['PENDING', 'OVERDUE'].includes(next)) return current;
  return next;
}

export function dto(charge) {
  return { id: charge.id, sellerId: charge.sellerId, description: charge.description,
    amountCents: charge.amountCents, dueDate: charge.dueDate, status: charge.status,
    providerId: charge.providerId, qr: charge.qr, warning: charge.warning,
    createdAt: charge.createdAt, updatedAt: charge.updatedAt };
}
