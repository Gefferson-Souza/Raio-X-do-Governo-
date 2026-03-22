import { test, expect } from '@playwright/test'

const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/ranking', label: 'Ranking' },
  { path: '/politicos', label: 'Politicos' },
  { path: '/gerador', label: 'Gerador' },
] as const

test.describe('Navigation (P0)', () => {
  test.describe('Top navigation — desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('top nav brand link is visible', async ({ page }) => {
      await page.goto('/')
      await expect(page.locator('header a', { hasText: 'RAIO-X DO GOVERNO' })).toBeVisible()
    })

    test('top nav shows all expected route links', async ({ page }) => {
      await page.goto('/')

      // TopNav links: GASTOS REAIS, RANKING, POLITICOS, GERADOR DE IMPACTO
      const expectedLabels = ['RANKING', 'POLITICOS', 'GERADOR DE IMPACTO']
      for (const label of expectedLabels) {
        await expect(page.locator(`nav a`, { hasText: label }).first()).toBeVisible()
      }
    })

    test('clicking RANKING in top nav navigates to /ranking', async ({ page }) => {
      await page.goto('/')
      await page.locator('nav a', { hasText: 'RANKING' }).first().click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/ranking/)
    })

    test('clicking POLITICOS in top nav navigates to /politicos', async ({ page }) => {
      await page.goto('/')
      await page.locator('nav a', { hasText: 'POLITICOS' }).first().click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/politicos/)
    })

    test('clicking brand logo navigates back to home', async ({ page }) => {
      await page.goto('/ranking')
      await page.locator('header a', { hasText: 'RAIO-X DO GOVERNO' }).click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Bottom navigation — mobile', () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test('bottom nav is visible on mobile viewport', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')
      // BottomNav uses md:hidden — visible below md breakpoint
      const bottomNav = page.locator('nav.fixed.bottom-0')
      await expect(bottomNav).toBeVisible()
    })

    test('bottom nav has four items: Inicio, Ranking, Politicos, Gerador', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const expectedLabels = ['Inicio', 'Ranking', 'Politicos', 'Gerador']
      for (const label of expectedLabels) {
        await expect(
          page.locator('nav.fixed.bottom-0').locator(`text=${label}`)
        ).toBeVisible()
      }
    })

    test('tapping Ranking in bottom nav navigates to /ranking', async ({ page }) => {
      await page.goto('/')
      await page.locator('nav.fixed.bottom-0').locator('text=Ranking').click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/ranking/)
    })

    test('tapping Politicos in bottom nav navigates to /politicos', async ({ page }) => {
      await page.goto('/')
      await page.locator('nav.fixed.bottom-0').locator('text=Politicos').click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/politicos/)
    })

    test('tapping Gerador in bottom nav navigates to /gerador', async ({ page }) => {
      await page.goto('/')
      await page.locator('nav.fixed.bottom-0').locator('text=Gerador').click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/gerador/)
    })
  })

  test.describe('All P0 routes return 200', () => {
    for (const route of ROUTES) {
      test(`${route.label} (${route.path}) returns HTTP 200`, async ({ page }) => {
        const response = await page.goto(route.path)
        expect(response?.status()).toBe(200)
      })
    }
  })

  test.describe('CTA links on home page', () => {
    test('CTA banner button navigates to /ranking', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // CtaBanner has buttonHref="/ranking" and buttonText="VER RANKING DE GASTOS"
      const ctaButton = page.locator('a', { hasText: 'VER RANKING DE GASTOS' })
      await expect(ctaButton).toBeVisible()
      await expect(ctaButton).toHaveAttribute('href', '/ranking')
    })
  })
})
