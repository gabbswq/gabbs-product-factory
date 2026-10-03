import { createIcons, Layers3, FlaskConical, Plus, RefreshCw, QrCode, Copy, Play, X } from 'lucide';

const $ = id => document.getElementById(id);
const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const labels = { CREATING: 'Criando', UNCERTAIN: 'Incerto', REJECTED: 'Recusado', PENDING: 'Pendente', CONFIRMED: 'Confirmado', RECEIVED: 'Recebido', OVERDUE: 'Vencido', REFUNDED: 'Estornado', CANCELED: 'Cancelado' };
const dispositions = { applied: 'Aplicado', stale: 'Antigo', ignored: 'Ignorado' };
let session, data = { charges: [], events: [] }, selected = null, busy = false, signature = '', detailSignature = '';
let refreshed = false;
let detail = null, recordSignature = '';
createIcons({ icons: { Layers3, FlaskConical, Plus, RefreshCw, QrCode, Copy, Play, X }, attrs: { 'aria-hidden': 'true' } });

async function api(url, method = 'GET', body, customHeaders = {}) {
  const response = await fetch(url, { method, credentials: 'same-origin', cache: 'no-store',
    headers: { ...(body ? { 'content-type': 'application/json', 'x-millennium-csrf': session.csrf } : {}), ...customHeaders },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  if (!response.ok && !result.charge) throw new Error(result.error ?? 'Falha no laboratorio local.');
  return result;
}

function notify(message, error = false) {
  $('notice').textContent = message; $('notice').classList.toggle('error', error); $('notice').hidden = !message;
}

function statusBadge(state) {
  const element = document.createElement('span'); element.className = `status ${Object.hasOwn(labels, state) ? state : ''}`;
  element.textContent = labels[state] ?? state; return element;
}

function renderRows() {
  const visible = data.charges.filter(charge => !$('filter').value || charge.status === $('filter').value);
  $('rows').replaceChildren(); $('empty').hidden = visible.length > 0;
  for (const charge of visible) {
    const row = document.createElement('tr'); row.classList.toggle('selected', charge.id === selected);
    const nameCell = document.createElement('td'); const button = document.createElement('button');
    button.className = 'row-button'; button.dataset.id = charge.id; button.textContent = charge.description;
    const id = document.createElement('small'); id.textContent = charge.id; button.append(id); nameCell.append(button);
    const value = document.createElement('td'); value.className = 'value'; value.textContent = money(charge.amountCents);
    const state = document.createElement('td'); state.append(statusBadge(charge.status));
    row.append(nameCell, value, state); $('rows').append(row);
  }
}

function renderEvents() {
  $('events').replaceChildren(); $('empty-events').hidden = data.events.length > 0;
  for (const event of data.events) {
    const row = document.createElement('li'); const name = document.createElement('strong'); name.textContent = event.event;
    const state = document.createElement('span'); state.className = 'status'; state.textContent = dispositions[event.disposition] ?? event.disposition;
    const id = document.createElement('small'); id.textContent = event.id;
    const time = document.createElement('time'); time.dateTime = event.at; time.textContent = new Date(event.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    row.append(name, state, id, time); $('events').append(row);
  }
}

function renderDetail(force = false) {
  const charge = detail?.id === selected ? detail : null;
  const next = JSON.stringify({ charge, busy });
  if (!force && next === detailSignature) return;
  detailSignature = next;
  $('detail').hidden = !charge; $('detail-empty').hidden = Boolean(charge); $('detail-status').replaceChildren();
  if (!charge) return;
  $('detail-status').append(statusBadge(charge.status));
  $('description').textContent = charge.description; $('charge-id').textContent = charge.id;
  $('detail-value').textContent = money(charge.amountCents); $('due-date').textContent = charge.dueDate.split('-').reverse().join('/');
  $('provider').textContent = session.mode === 'simulator' ? 'Simulador local' : 'Asaas Sandbox';
  $('warning').hidden = !charge.warning; $('warning').textContent = charge.warning ?? '';
  const qrVisible = Boolean(charge.qr) && ['PENDING', 'OVERDUE'].includes(charge.status);
  $('qr-frame').hidden = !qrVisible; $('code-block').hidden = !qrVisible;
  if (qrVisible) {
    $('qr-image').src = charge.qr.image; $('payload').value = charge.qr.payload;
    $('qr-caption').textContent = session.mode === 'simulator' ? 'Simula\u00e7\u00e3o \u00b7 n\u00e3o pag\u00e1vel' : 'Asaas Sandbox \u00b7 somente teste';
    $('code-label').textContent = session.mode === 'simulator' ? 'C\u00f3digo de teste' : 'Pix copia e cola (sandbox)';
  } else { $('qr-image').removeAttribute('src'); $('payload').value = ''; }
  $('reconcile').disabled = busy || charge.status === 'CREATING';
  $('simulation').hidden = session.mode !== 'simulator' || !charge.providerId;
  $('simulate').disabled = busy; $('sim-event').disabled = busy;
}

async function loadDetail(force = false) {
  const record = data.charges.find(item => item.id === selected);
  if (!record) { detail = null; recordSignature = ''; renderDetail(force); return; }
  const next = JSON.stringify(record);
  if (!force && detail?.id === selected && recordSignature === next) return;
  const charge = await api(`/api/charges/${encodeURIComponent(record.id)}`);
  if (selected !== record.id) return;
  detail = charge; recordSignature = next; renderDetail(force);
}

async function refresh(force = false) {
  const result = await api('/api/charges');
  $('connection').textContent = 'Local \u00b7 conectado';
  const next = JSON.stringify(result);
  if (next !== signature || force) {
    data = result; signature = next;
    if (!selected || !data.charges.some(item => item.id === selected)) selected = data.charges[0]?.id ?? null;
    $('count').textContent = String(data.summary.count); $('pending').textContent = money(data.summary.pendingCents); $('received').textContent = money(data.summary.receivedCents);
    renderRows(); renderEvents(); await loadDetail(force);
  }
  refreshed = true;
}

function setBusy(value) {
  busy = value; $('new-charge').disabled = value; $('submit-charge').disabled = value;
  $('create-form').setAttribute('aria-busy', String(value)); renderDetail();
}

async function action(callback) {
  if (busy) return;
  setBusy(true); notify('');
  try { await callback(); await refresh(true); }
  catch (error) { notify(error.message, true); }
  finally { setBusy(false); }
}

function tab(name, focus = false) {
  for (const view of ['charges', 'events']) {
    $(`${view}-tab`).setAttribute('aria-selected', String(view === name));
    $(`${view}-tab`).tabIndex = view === name ? 0 : -1; $(`${view}-view`).hidden = view !== name;
  }
  if (focus) $(`${name}-tab`).focus();
}
for (const name of ['charges', 'events']) {
  $(`${name}-tab`).addEventListener('click', () => tab(name));
  $(`${name}-tab`).addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); tab(event.key === 'Home' ? 'charges' : event.key === 'End' ? 'events' : name === 'charges' ? 'events' : 'charges', true);
    }
  });
}
$('rows').addEventListener('click', event => {
  const button = event.target.closest('button[data-id]'); if (!button) return;
  selected = button.dataset.id; renderRows(); renderDetail(true);
  loadDetail().catch(error => notify(error.message, true));
});
$('filter').addEventListener('change', renderRows);
$('refresh').addEventListener('click', () => refresh(true).catch(error => notify(error.message, true)));
$('new-charge').addEventListener('click', () => {
  $('form-error').hidden = true; $('form-date').min = session.today;
  if (!$('form-date').value) $('form-date').value = session.today;
  $('create-dialog').showModal(); $('form-description').focus();
});
for (const id of ['close-dialog', 'cancel-dialog']) $(id).addEventListener('click', () => $('create-dialog').close());
$('create-form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  const body = Object.fromEntries(new FormData(event.currentTarget));
  if (!body.description.trim() || !/^\d{1,5}(?:[.,]\d{1,2})?$/.test(body.amount)) {
    $('form-error').textContent = 'Descri\u00e7\u00e3o e valor v\u00e1lidos s\u00e3o obrigat\u00f3rios.'; $('form-error').hidden = false; return;
  }
  const fingerprint = JSON.stringify(body);
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem('millennium-pix-pending')); } catch {}
  const key = saved?.fingerprint === fingerprint ? saved.key : crypto.randomUUID();
  sessionStorage.setItem('millennium-pix-pending', JSON.stringify({ key, fingerprint }));
  setBusy(true); $('form-error').hidden = true;
  try {
    const result = await api('/api/charges', 'POST', body, { 'idempotency-key': key });
    selected = result.charge.id; $('create-dialog').close();
    sessionStorage.removeItem('millennium-pix-pending'); $('create-form').reset();
    await refresh(true);
    notify(result.charge.warning ?? 'Cobran\u00e7a de teste registrada.', result.charge.status === 'REJECTED');
  } catch (error) { $('form-error').textContent = error.message; $('form-error').hidden = false; }
  finally { setBusy(false); }
});
$('reconcile').addEventListener('click', () => action(async () => {
  await api(`/api/charges/${encodeURIComponent(selected)}/reconcile`, 'POST', {}); notify('Concilia\u00e7\u00e3o de teste conclu\u00edda.');
}));
$('simulate').addEventListener('click', () => action(async () => {
  await api(`/api/charges/${encodeURIComponent(selected)}/simulate`, 'POST', { event: $('sim-event').value }); notify('Evento simulado registrado.');
}));
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('payload').value); notify('C\u00f3digo copiado.'); }
  catch { notify('N\u00e3o foi poss\u00edvel acessar a \u00e1rea de transfer\u00eancia.', true); }
});

async function connect() {
  try {
    session = await api('/api/session');
    $('mode').textContent = session.mode === 'simulator' ? 'Simula\u00e7\u00e3o local' : 'Asaas Sandbox';
    await refresh(true); $('new-charge').disabled = false;
  } catch (error) { $('connection').textContent = 'Local \u00b7 indispon\u00edvel'; notify(error.message, true); }
}
await connect();
setInterval(() => {
  if (!document.hidden && refreshed && !busy) refresh().catch(() => { $('connection').textContent = 'Local \u00b7 desconectado'; });
}, 2000);
