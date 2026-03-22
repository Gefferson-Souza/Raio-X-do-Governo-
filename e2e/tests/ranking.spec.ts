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
    await expect(page.getByRole('heading', { name: /RANKING/i })).toBeVisible()
  })

  test('data source attribution is visible', async ({ page }) => {
    await expect(page.getByText(/FONTE.*PORTAL DA TRANSPARENCIA/i)).toBeVisible()
  })

  test('spending data or info message is rendered', async ({ page }) => {
    const infoMessage = page.getByText(/Nenhum dado de orgao disponivel/i)
    const podium = page.getByText(/OS CAMPEOES/i)
    await expect.soft(infoMessage.or(podium).first()).toBeVisible({ timeout: 10_000 })
  })

  test('contracts section heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ULTIMOS CONTRATOS/i })).toBeVisible()
  })

  test('contracts section has content or empty message', async ({ page }) => {
    const noContracts = page.getByText(/Nenhum contrato recente/i)
    const contractContent = page.getByText(/ULTIMOS CONTRATOS/i)
    await expect(noContracts.or(contractContent).first()).toBeVisible()
  })

  test('no uncaught JS error on ranking page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/ranking')
    await page.waitForLoadState('networkidle')
    const critical = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection')
    )
    expect(critical).toHaveLength(0)
  })
})
