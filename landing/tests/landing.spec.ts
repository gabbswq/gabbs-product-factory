import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const repositoryUrl = 'https://github.com/gabbswq/gabbs-product-factory'

test('explica a proposta e leva ao repositório correto', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('./')

  await expect(page).toHaveTitle(/Gabbs Product Factory/)
  await expect(page.getByRole('heading', { name: 'Ideia. Código. Revisão.' })).toBeVisible()
  await expect(page.getByText(/dentro do VS Code/).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Explorar no GitHub/ })).toHaveAttribute('href', repositoryUrl)
  await expect(page.getByRole('heading', { name: 'A conversa não termina no prompt.' })).toBeVisible()
  expect(errors).toEqual([])
})

test('é uma apresentação estática, sem formulário ou chamadas a serviços externos', async ({ page }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173/')) externalRequests.push(request.url())
  })
  await page.goto('./')
  expect(await page.locator('form, input, textarea, select').count()).toBe(0)
  expect(externalRequests).toEqual([])
})

test('os links de navegação levam às seções e ao GitHub', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'O processo', exact: true }).click()
  await expect(page).toHaveURL(/#processo$/)
  await expect(page.getByRole('heading', { name: 'A conversa não termina no prompt.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver o repositório/ })).toHaveAttribute('href', repositoryUrl)
})

test('mantém o conteúdo dentro da tela em larguras desktop e celular', async ({ page }) => {
  await page.goto('./')
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
  await expect(page.getByRole('link', { name: /Explorar no GitHub/ })).toBeVisible()
})

test('não depende de movimento para apresentar seu conteúdo', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Ideia. Código. Revisão.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Explorar no GitHub/ })).toBeVisible()
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  await context.close()
})

test('revela as etapas ao rolar sem deixar texto escondido', async ({ page }) => {
  await page.goto('./')
  const items = page.locator('.process-item')

  for (let index = 0; index < await items.count(); index += 1) {
    const item = items.nth(index)
    await item.scrollIntoViewIfNeeded()
    await expect(item).toHaveCSS('opacity', '1')
    await expect(item.locator('h3')).toBeVisible()
  }
})

test('não apresenta violações WCAG A/AA detectáveis pelo axe', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const violations = results.violations.map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(', ')).join('; ')}`)
  expect(violations).toEqual([])
})
