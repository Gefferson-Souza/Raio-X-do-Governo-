import { describe, it, expect } from 'vitest'
import type {
  DespesaPorOrgao,
  Contrato,
  EmpresaSancionada,
  SpendingSummary,
} from '@/lib/api/types'

describe('API types', () => {
  describe('DespesaPorOrgao', () => {
    it('accepts a valid shape', () => {
      const despesa: DespesaPorOrgao = {
        ano: 2025,
        codigoOrgaoSuperior: '26000',
        orgaoSuperior: 'Ministério da Educação',
        codigoOrgao: '26101',
        orgao: 'Secretaria Executiva',
        empenhado: 1_000_000,
        liquidado: 900_000,
        pago: 800_000,
      }
      expect(despesa.ano).toBe(2025)
      expect(despesa.pago).toBe(800_000)
    })
  })

  describe('Contrato', () => {
    it('accepts a valid shape', () => {
      const contrato: Contrato = {
        id: 1,
        numero: '00001/2025',
        objeto: 'Serviços de TI',
        situacaoContrato: 'Vigente',
        dataAssinatura: '2025-01-15',
        dataFimVigencia: '2026-01-15',
        dataInicioVigencia: '2025-01-15',
        compra: { numero: '00001/2025', objeto: 'Serviços de TI' },
        fornecedor: { id: 1, cnpjFormatado: '12.345.678/0001-00', nome: 'Empresa X', tipo: 'PJ' },
        unidadeGestora: {
          codigo: '110001',
          nome: 'UG Test',
          orgaoVinculado: { nome: 'Orgao Y', sigla: 'OY' },
          orgaoMaximo: { codigo: '10000', nome: 'Orgao Y', sigla: 'OY' },
        },
        valorFinalCompra: 500_000,
        valorInicialCompra: 400_000,
      }
      expect(contrato.id).toBe(1)
      expect(contrato.compra.objeto).toBe('Serviços de TI')
      expect(contrato.unidadeGestora.orgaoVinculado.nome).toBe('Orgao Y')
    })
  })

  describe('EmpresaSancionada', () => {
    it('accepts a valid shape', () => {
      const empresa: EmpresaSancionada = {
        id: 42,
        dataInicioSancao: '2024-06-01',
        dataFimSancao: '2025-06-01',
        orgaoSancionador: { nome: 'CGU' },
        sancionado: { cnpjCpf: '98765432000199', nome: 'Empresa Z' },
        tipoSancao: { descricaoResumida: 'Impedimento de Licitar' },
      }
      expect(empresa.sancionado.nome).toBe('Empresa Z')
      expect(empresa.tipoSancao.descricaoResumida).toBe('Impedimento de Licitar')
    })
  })

  describe('SpendingSummary', () => {
    it('accepts a valid shape', () => {
      const summary: SpendingSummary = {
        totalPago: 5_000_000,
        totalEmpenhado: 6_000_000,
        totalLiquidado: 5_500_000,
        porOrgao: [],
        atualizadoEm: '2025-07-01T12:00:00.000Z',
        source: 'live',
      }
      expect(summary.totalPago).toBe(5_000_000)
      expect(summary.porOrgao).toEqual([])
      expect(summary.source).toBe('live')
    })

    it('accepts all valid source values', () => {
      const sources: SpendingSummary['source'][] = ['live', 'cached', 'error']
      for (const source of sources) {
        const summary: SpendingSummary = {
          totalPago: 0,
          totalEmpenhado: 0,
          totalLiquidado: 0,
          porOrgao: [],
          atualizadoEm: '2025-07-01T12:00:00.000Z',
          source,
        }
        expect(summary.source).toBe(source)
      }
    })
  })
})
