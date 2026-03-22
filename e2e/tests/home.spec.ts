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
    // The h1 contains "PRA ONDE VAI" and "SEU DINHEIRO" split across lines
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/PRA ONDE VAI/i)
  })

  test('site branding is visible in top navigation', async ({ page }) => {
    await expect(page.locator('text=RAIO-X DO GOVERNO')).toBeVisible()
  })

  test('official data source label is visible', async ({ page }) => {
    await expect(
      page.locator('text=DADOS OFICIAIS DO PORTAL DA TRANSPARENCIA')
    ).toBeVisible()
  })

  test('explainer box describes what is shown', async ({ page }) => {
    // The box that reads "O que voce esta vendo:" is always server-rendered
    await expect(page.locator('text=O que voce esta vendo')).toBeVisible()
  })

  test('spending stats bar or error banner is rendered', async ({ page }) => {
    // Either the stats are live or an error banner is shown — both are valid states
    const statsOrError = page.locator(
      '[data-testid="stats-bar"], text=INDISPONIVEL, text=Empenhado, text=Liquidado, text=Pago, text=DADOS INDISPONIVEIS'
    )
    // Soft assertion: data-dependent but page structure should always render one
    await expect
      .soft(statsOrError.first())
      .toBeVisible({ timeout: 15_000 })
  })

  test('equivalence section or error state is rendered', async ({ page }) => {
    // When spending data is available, equivalence cards appear
    // Labels present in the four KPI cards on the home page
    const equivalenceLabels = [
      'POR CADA BRASILEIRO',
      'POR FAMILIA DE 4 PESSOAS',
      'POR DIA',
      'SALARIOS MINIMOS POR PESSOA',
    ]

    // At least one card label OR the error state must be visible
    let found = false
    for (const label of equivalenceLabels) {
      const el = page.locator(`text=${label}`)
      const count = await el.count()
      if (count > 0) {
        found = true
        break
      }
    }

    const errorVisible = await page.locator('text=DADOS INDISPONIVEIS').count()

    expect.soft(found || errorVisible > 0).toBeTruthy()
  })

  test('CTA banner linking to ranking is visible', async ({ page }) => {
    // CtaBanner renders "FISCALIZE. COMPARTILHE. COBRE."
    await expect
      .soft(page.locator('text=FISCALIZE. COMPARTILHE. COBRE.'))
      .toBeVisible()
  })

  test('recent contracts section heading is visible', async ({ page }) => {
    await expect(page.locator('text=CONTRATOS RECENTES')).toBeVisible()
  })

  test('no uncaught JS error on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Filter out known third-party noise
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
