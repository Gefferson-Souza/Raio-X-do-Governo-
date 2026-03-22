import { test, expect } from '@playwright/test'

test.describe('Politicos page (P0)', () => {
  test('page loads with HTTP 200', async ({ page }) => {
    const response = await page.request.get('/politicos')
    expect(response.status()).toBe(200)
  })

  test('main heading is visible', async ({ page }) => {
    await page.goto('/politicos')
    await expect(page.getByRole('heading', { name: /RAIO-X DOS POLITICOS/i })).toBeVisible()
  })

  test('data source badge is visible', async ({ page }) => {
    await page.goto('/politicos')
    await page.waitForLoadState('domcontentloaded')
    const badge = page.locator('main').filter({ hasText: /DADOS ABERTOS/ })
    await expect(badge.first()).toBeVisible()
  })

  test('loading state or content is rendered', async ({ page }) => {
    await page.goto('/politicos')
    const loading = page.getByText(/BUSCANDO DADOS/i)
    const heading = page.getByRole('heading', { name: /RAIO-X DOS POLITICOS/i })
    await expect(loading.or(heading).first()).toBeVisible({ timeout: 10_000 })
  })

  test('/politicos/congresso returns 200', async ({ page }) => {
    const response = await page.request.get('/politicos/congresso')
    expect(response.status()).toBe(200)
  })

  test('/politicos/partidos returns 200', async ({ page }) => {
    const response = await page.request.get('/politicos/partidos')
    expect(response.status()).toBe(200)
  })

  test('/politicos/congresso renders without 404', async ({ page }) => {
    await page.goto('/politicos/congresso')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible()
    expect.soft(await page.getByText('404').count()).toBe(0)
  })

  test('/politicos/partidos renders without 404', async ({ page }) => {
    await page.goto('/politicos/partidos')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible()
    expect.soft(await page.getByText('404').count()).toBe(0)
  })

  test('no uncaught JS error on politicos page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/politicos')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)
    const critical = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection') && !e.includes('fetch')
    )
    expect(critical).toHaveLength(0)
  })
})
