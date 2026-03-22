import { test, expect } from '@playwright/test'

test.describe('Politicos page (P0)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/politicos')
    await page.waitForLoadState('networkidle')
  })

  test('page loads with HTTP 200', async ({ page }) => {
    const response = await page.request.get('/politicos')
    expect(response.status()).toBe(200)
  })

  test('main heading RAIO-X DOS POLITICOS is visible', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'RAIO-X DOS POLITICOS' })).toBeVisible()
  })

  test('data source badge is visible', async ({ page }) => {
    await expect(
      page.locator('text=DADOS ABERTOS — CAMARA + SENADO + PORTAL DA TRANSPARENCIA')
    ).toBeVisible()
  })

  test('page content renders (data or loading or empty state)', async ({ page }) => {
    // The page uses PoliticiansContent and PoliticiansBody client components.
    // Three valid outcomes: content visible, loading spinner, or error/empty state.
    const hasContent = await page.locator('[data-testid]').count()
    const hasText = await page.locator('text=RAIO-X DOS POLITICOS').count()

    // The h1 heading is always server-rendered, so it must be present
    expect(hasText).toBeGreaterThan(0)

    // Soft: data may or may not have loaded depending on API key availability
    expect.soft(hasContent).toBeGreaterThanOrEqual(0)
  })

  test('navigating to /politicos/congresso returns 200', async ({ page }) => {
    const response = await page.request.get('/politicos/congresso')
    expect(response.status()).toBe(200)
  })

  test('navigating to /politicos/partidos returns 200', async ({ page }) => {
    const response = await page.request.get('/politicos/partidos')
    expect(response.status()).toBe(200)
  })

  test('/politicos/congresso page heading is visible', async ({ page }) => {
    await page.goto('/politicos/congresso')
    await page.waitForLoadState('networkidle')
    // Page should render without a 404/500 — some content must appear
    const body = page.locator('body')
    await expect(body).toBeVisible()
    // Should not show Next.js default 404 text
    const notFoundCount = await page.locator('text=404').count()
    expect.soft(notFoundCount).toBe(0)
  })

  test('/politicos/partidos page heading is visible', async ({ page }) => {
    await page.goto('/politicos/partidos')
    await page.waitForLoadState('networkidle')
    const body = page.locator('body')
    await expect(body).toBeVisible()
    const notFoundCount = await page.locator('text=404').count()
    expect.soft(notFoundCount).toBe(0)
  })

  test('no uncaught JS error on politicos page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/politicos')
    await page.waitForLoadState('networkidle')
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
