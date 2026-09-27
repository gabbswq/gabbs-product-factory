import { chromium } from '@playwright/test'

const targetUrl = process.argv[2] ?? 'https://gabbswq.github.io/gabbs-product-factory/'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const externalRequests = []
const pageErrors = []

page.on('request', (request) => {
  if (new URL(request.url()).origin !== new URL(targetUrl).origin) {
    externalRequests.push(request.url())
  }
})
page.on('pageerror', (error) => pageErrors.push(error.message))
await page.addInitScript(() => {
  window.__largestContentfulPaint = 0
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__largestContentfulPaint = entry.startTime
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true })
})

let response
try {
  response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30_000 })
  await page.waitForTimeout(500)
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0]
    const paints = performance.getEntriesByType('paint')
    return {
      ttfbMs: Math.round(navigation.responseStart - navigation.requestStart),
      domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
      loadMs: Math.round(navigation.loadEventEnd),
      fcpMs: Math.round(paints.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? 0),
      lcpMs: Math.round(window.__largestContentfulPaint),
      resourceCount: performance.getEntriesByType('resource').length,
    }
  })

  console.log(JSON.stringify({
    url: targetUrl,
    status: response.status(),
    ...metrics,
    externalRequests,
    pageErrors,
  }, null, 2))

  if (!response.ok() || pageErrors.length > 0) process.exitCode = 1
} finally {
  await browser.close()
}
