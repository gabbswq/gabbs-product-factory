import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApplication } from '../app.mjs';

const test = base.extend({
  lab: async ({ page }, use) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'millennium-pix-browser-'));
    const { app } = createApplication({ dataDir: dir });
    const url = await app.listen({ host: '127.0.0.1', port: 0 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(url);
      await expect(page.getByRole('button', { name: 'Nova cobrança', exact: true })).toBeEnabled();
      await use({ url, errors });
      expect(errors).toEqual([]);
    } finally {
      await app.close();
      expect(path.dirname(dir)).toBe(os.tmpdir());
      expect(path.basename(dir)).toMatch(/^millennium-pix-browser-/);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
});

async function newCharge(page, description = 'Pedido de teste', amount = '10,01') {
  await page.getByRole('button', { name: 'Nova cobrança', exact: true }).click();
  await page.getByLabel('Descrição', { exact: true }).fill(description);
  await page.getByLabel('Valor em R$', { exact: true }).fill(amount);
  await page.locator('#form-date').fill('2099-01-01');
  await page.getByRole('button', { name: 'Gerar cobrança', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('#description')).toHaveText(description);
}

test('formulario cria QR nao pagavel, concilia e persiste apos recarga', async ({ page, lab }, info) => {
  await newCharge(page);
  await expect(page.locator('#qr-caption')).toContainText('não pagável');
  await expect(page.locator('#payload')).toHaveValue(/^MILLENNIUM-SIMULATION:/);
  await expect(page.locator('#detail-value')).toContainText('10,01');
  await expect(page.locator('#qr-image')).toBeVisible();
  const pixels = await page.locator('#qr-image').evaluate(image => {
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const bytes = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let black = 0, white = 0;
    for (let n = 0; n < bytes.length; n += 4) { if (bytes[n] < 50) black++; if (bytes[n] > 220) white++; }
    return { width: image.naturalWidth, black, white };
  });
  expect(pixels.width).toBe(280); expect(pixels.black).toBeGreaterThan(1000); expect(pixels.white).toBeGreaterThan(1000);
  await page.getByRole('button', { name: 'Conciliar', exact: true }).click();
  await expect(page.locator('#notice')).toContainText('Conciliação');
  await page.screenshot({ path: info.outputPath(`pix-${info.project.name}.png`), fullPage: true });
  await page.reload();
  await expect(page.locator('#count')).toHaveText('1');
  await expect(page.locator('#description')).toHaveText('Pedido de teste');
});

test('recebimento e estorno alteram total e exibem eventos reais do simulador', async ({ page, lab }) => {
  await newCharge(page);
  await page.getByRole('button', { name: 'Simular', exact: true }).click();
  await expect(page.locator('#detail-status')).toHaveText('Recebido');
  await expect(page.locator('#received')).toContainText('10,01');
  await expect(page.locator('#qr-frame')).not.toBeVisible();
  await page.getByRole('tab', { name: 'Eventos', exact: true }).click();
  await expect(page.locator('#events')).toContainText('PAYMENT_RECEIVED');
  await page.locator('#sim-event').selectOption('PAYMENT_REFUNDED');
  await page.getByRole('button', { name: 'Simular', exact: true }).click();
  await expect(page.locator('#detail-status')).toHaveText('Estornado');
  await expect(page.locator('#received')).toContainText('0,00');
  await expect(page.locator('#events')).toContainText('PAYMENT_REFUNDED');
});

test('validacao mostra erro sem perder formulario e sem criar cobranca', async ({ page, lab }) => {
  await page.getByRole('button', { name: 'Nova cobrança', exact: true }).click();
  await page.getByLabel('Descrição', { exact: true }).fill('   ');
  await page.getByLabel('Valor em R$', { exact: true }).fill('1e3');
  await page.getByRole('button', { name: 'Gerar cobrança', exact: true }).click();
  await expect(page.locator('#form-error')).toBeVisible();
  await expect(page.locator('#count')).toHaveText('0');
  await page.getByLabel('Descrição', { exact: true }).fill('Pedido corrigido');
  await page.getByLabel('Valor em R$', { exact: true }).fill('10000.01');
  await page.getByRole('button', { name: 'Gerar cobrança', exact: true }).click();
  await expect(page.locator('#form-error')).toContainText('10.000,00');
  await expect(page.getByLabel('Descrição', { exact: true })).toHaveValue('Pedido corrigido');
});

test('teclado abre e fecha modal e navega abas sem controles ficticios', async ({ page, lab }) => {
  const button = page.getByRole('button', { name: 'Nova cobrança', exact: true });
  await button.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#form-description')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('tab', { name: 'Cobranças', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Eventos', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('texto do usuario nao executa HTML e layout de valor maximo cabe em 320px', async ({ page, lab }, info) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const payload = '<img src=x onerror="window.injected=true">';
  await newCharge(page, payload, '10000');
  expect(await page.evaluate(() => Boolean(window.injected))).toBe(false);
  await expect(page.locator('#description')).toHaveText(payload);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const selector of ['#pending', '#received', 'td.value']) {
    const bounds = await page.locator(selector).evaluate(element => {
      const range = document.createRange(); range.selectNodeContents(element);
      const text = range.getBoundingClientRect(), box = element.getBoundingClientRect();
      return { fits: text.right <= box.right + 1, singleLine: range.getClientRects().length === 1 };
    });
    expect(bounds.fits).toBe(true); expect(bounds.singleLine).toBe(true);
  }
  await page.screenshot({ path: info.outputPath('pix-320.png'), fullPage: true });
});

test('trocar cobranca carrega somente o detalhe escolhido e poll nao recarrega QR', async ({ page, lab }) => {
  await newCharge(page, 'Primeiro pedido', '10');
  await newCharge(page, 'Segundo pedido', '20');
  const calls = []; page.on('request', request => calls.push(request.url()));
  await page.locator('.row-button').filter({ hasText: 'Primeiro pedido' }).click();
  await expect(page.locator('#description')).toHaveText('Primeiro pedido');
  await expect(page.locator('#detail-value')).toContainText('10,00');
  await expect.poll(() => calls.filter(url => url.endsWith('/api/charges')).length).toBeGreaterThan(0);
  expect(calls.filter(url => /\/api\/charges\/[^/]+$/.test(url)).length).toBe(1);
});
