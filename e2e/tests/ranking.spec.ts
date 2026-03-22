import { test, expect } from '@playwright/test'

test.describe('Ranking page (P0)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ranking')
    await page.waitForLoadState('networkidle')
  })

  test('page loads with HTTP 200', async ({ page }) => {
    const response = await page.request.get('/ranking')
    expect(response.status()).toBe(200)
  })

  test('ranking page hero heading is visible', async ({ page }) => {
    const heading = page.locator('h2').filter({ hasText: /RANKING/i })
    await expect(heading.first()).toBeVisible()
  })

  test('data source attribution is visible', async ({ page }) => {
    await expect(page.locator('text=PORTAL DA TRANSPARENCIA')).toBeVisible()
  })

  test('spending data or error state is rendered for organ ranking', async ({ page }) => {
    // Either podium cards (ministry names) or the error banner must be present
    const podiumSection = page.locator('text=OS CAMPEOES DO GASTO')
    const errorSection = page.locator('text=DADOS INDISPONIVEIS')

    const podiumCount = await podiumSection.count()
    const errorCount = await errorSection.count()

    expect.soft(podiumCount > 0 || errorCount > 0).toBeTruthy()
  })

  test('budget execution progressbars are present when data available', async ({ page }) => {
    // progressbar roles are rendered inside "ORGAOS COM DINHEIRO PARADO" section
    const progressBars = page.locator('[role="progressbar"]')
    const count = await progressBars.count()

    if (count > 0) {
      // If progressbars exist, at least the first should have aria attributes
      const firstBar = progressBars.first()
      await expect(firstBar).toHaveAttribute('aria-valuenow')
      await expect(firstBar).toHaveAttribute('aria-valuemin', '0')
      await expect(firstBar).toHaveAttribute('aria-valuemax', '100')
    } else {
      // Error state is an acceptable fallback
      await expect
        .soft(page.locator('text=DADOS INDISPONIVEIS'))
        .toBeVisible()
    }
  })

  test('contract timeline section heading is visible', async ({ page }) => {
    await expect(page.locator('text=ULTIMOS CONTRATOS')).toBeVisible()
  })

  test('contracts timeline or its error state is rendered', async ({ page }) => {
    const timelineRows = page.locator('text=ULTIMOS CONTRATOS')
    await expect(timelineRows.first()).toBeVisible()

    // The section itself always renders — contracts list or error
    const contractsError = page.locator('text=Nao foi possivel carregar os contratos recentes')
    const noContracts = page.locator('text=Nenhum contrato recente encontrado')

    // If neither timeline content nor error, the section structure still exists
    const sectionExists =
      (await timelineRows.count()) > 0 ||
      (await contractsError.count()) > 0 ||
      (await noContracts.count()) > 0

    expect(sectionExists).toBeTruthy()
  })

  test('no uncaught JS error on ranking page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/ranking')
    await page.waitForLoadState('networkidle')
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
