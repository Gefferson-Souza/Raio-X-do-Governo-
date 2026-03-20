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
        nomeOrgaoSuperior: 'Ministério da Educação',
        codigoOrgao: '26101',
        nomeOrgao: 'Secretaria Executiva',
        valorEmpenhado: 1_000_000,
        valorLiquidado: 900_000,
        valorPago: 800_000,
        valorRestoInscrito: 50_000,
        valorRestoPago: 40_000,
      }
      expect(despesa.ano).toBe(2025)
      expect(despesa.valorPago).toBe(800_000)
    })
  })

  describe('Contrato', () => {
    it('accepts a valid shape', () => {
      const contrato: Contrato = {
        id: 1,
        dataAssinatura: '2025-01-15',
        dataFimVigencia: '2026-01-15',
        dataInicioVigencia: '2025-01-15',
        dimCompra: { numero: '00001/2025', objeto: 'Serviços de TI' },
        fornecedor: { cnpjCpf: '12345678000100', nome: 'Empresa X' },
        unidadeGestora: {
          codigo: '110001',
          nome: 'UG Test',
          orgaoVinculado: { codigo: '10000', nome: 'Orgao Y' },
        },
        valorFinal: 500_000,
        valorInicial: 400_000,
      }
      expect(contrato.id).toBe(1)
      expect(contrato.dimCompra.objeto).toBe('Serviços de TI')
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
