import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException } from '@nestjs/common'
import { SpendingController } from '../spending/spending.controller'

const makeSpendingService = () => ({
  getLatestSnapshot: vi.fn(),
})

describe('SpendingController', () => {
  let controller: SpendingController
  let spendingService: ReturnType<typeof makeSpendingService>

  beforeEach(() => {
    spendingService = makeSpendingService()
    controller = new SpendingController(spendingService as any)
  })

  describe('getSummary', () => {
    it('returns data from SpendingService when snapshot exists', async () => {
      const mockSnapshot = {
        totalPago: 1_000_000,
        totalEmpenhado: 1_200_000,
        totalLiquidado: 1_100_000,
        porOrgao: [{ orgao: 'Min. Saude', pago: 500_000 }],
        atualizadoEm: '2024-01-01T00:00:00.000Z',
        source: 'cached' as const,
      }
      spendingService.getLatestSnapshot.mockResolvedValue(mockSnapshot)

      const result = await controller.getSummary('2024')

      expect(spendingService.getLatestSnapshot).toHaveBeenCalledWith(2024)
      expect(result).toEqual(mockSnapshot)
    })

    it('uses the current year when no year parameter is provided', async () => {
      const currentYear = new Date().getFullYear()
      spendingService.getLatestSnapshot.mockResolvedValue({
        totalPago: 0,
        totalEmpenhado: 0,
        totalLiquidado: 0,
        porOrgao: [],
        atualizadoEm: new Date().toISOString(),
        source: 'error' as const,
      })

      await controller.getSummary(undefined)

      expect(spendingService.getLatestSnapshot).toHaveBeenCalledWith(currentYear)
    })

    it('throws BadRequestException when year is not a valid number (abc)', async () => {
      await expect(controller.getSummary('abc')).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException with message "Invalid year parameter" when year is NaN', async () => {
      await expect(controller.getSummary('abc')).rejects.toThrow('Invalid year parameter')
    })

    it('throws BadRequestException when year is below the allowed range (1999)', async () => {
      await expect(controller.getSummary('1999')).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when year equals the lower boundary minus 1 (1999)', async () => {
      await expect(controller.getSummary('1999')).rejects.toThrow('Invalid year parameter')
    })

    it('throws BadRequestException when year is above the allowed range (2101)', async () => {
      await expect(controller.getSummary('2101')).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when year equals the upper boundary plus 1 (2101)', async () => {
      await expect(controller.getSummary('2101')).rejects.toThrow('Invalid year parameter')
    })

    it('accepts the lower boundary year 2000', async () => {
      spendingService.getLatestSnapshot.mockResolvedValue({
        totalPago: 0,
        totalEmpenhado: 0,
        totalLiquidado: 0,
        porOrgao: [],
        atualizadoEm: new Date().toISOString(),
        source: 'error' as const,
      })

      await expect(controller.getSummary('2000')).resolves.not.toThrow()
      expect(spendingService.getLatestSnapshot).toHaveBeenCalledWith(2000)
    })

    it('accepts the upper boundary year 2100', async () => {
      spendingService.getLatestSnapshot.mockResolvedValue({
        totalPago: 0,
        totalEmpenhado: 0,
        totalLiquidado: 0,
        porOrgao: [],
        atualizadoEm: new Date().toISOString(),
        source: 'error' as const,
      })

      await expect(controller.getSummary('2100')).resolves.not.toThrow()
      expect(spendingService.getLatestSnapshot).toHaveBeenCalledWith(2100)
    })

    it('treats empty string year as missing (uses current year)', async () => {
      // '' is falsy in JS so the controller uses new Date().getFullYear()
      const currentYear = new Date().getFullYear()
      spendingService.getLatestSnapshot.mockResolvedValue({
        totalPago: 0, totalEmpenhado: 0, totalLiquidado: 0,
        porOrgao: [], atualizadoEm: new Date().toISOString(), source: 'error' as const,
      })

      await controller.getSummary('')

      expect(spendingService.getLatestSnapshot).toHaveBeenCalledWith(currentYear)
    })
  })
})
