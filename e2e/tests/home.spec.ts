import { test, expect } from '@playwright/test'

test.describe('Home page (P0)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('page loads with HTTP 200', async ({ page }) => {
    const response = await page.request.get('/')
    expect(response.status()).toBe(200)
  })

  test('main heading is visible', async ({ page }) => {
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/PRA ONDE VAI/i)
  })

  test('site branding is visible in top navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: /RAIO-X DO GOVERNO/i })).toBeVisible()
  })

  test('official data source badge is visible', async ({ page }) => {
    await expect(page.locator(':text-is("DADOS OFICIAIS DO PORTAL DA TRANSPARENCIA")')).toBeVisible()
  })

  test('explainer box describes what is shown', async ({ page }) => {
    await expect(page.getByText(/O que voce esta vendo/i)).toBeVisible()
  })

  test('spending counter or empty state is rendered', async ({ page }) => {
    const counter = page.getByText(/TOTAL GASTO PELO GOVERNO/i)
    const progress = page.getByRole('progressbar')
    await expect.soft(counter.or(progress).first()).toBeVisible({ timeout: 15_000 })
  })

  test('equivalence section is rendered', async ({ page }) => {
    const labels = ['POR CADA BRASILEIRO', 'POR FAMILIA', 'POR DIA', 'SALARIOS MINIMOS']
    let found = false
    for (const label of labels) {
      if ((await page.getByText(new RegExp(label, 'i')).count()) > 0) {
        found = true
        break
      }
    }
    expect.soft(found).toBeTruthy()
  })

  test('CTA banner is visible', async ({ page }) => {
    await expect.soft(page.getByText(/FISCALIZE.*COMPARTILHE.*COBRE/i)).toBeVisible()
  })

  test('recent contracts section heading is visible', async ({ page }) => {
    await expect(page.getByText(/CONTRATOS RECENTES/i)).toBeVisible()
  })

  test('no uncaught JS error on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const critical = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection')
    )
    expect(critical).toHaveLength(0)
  })
})
