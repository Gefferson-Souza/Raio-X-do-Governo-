import { describe, it, expect } from 'vitest'
import { convertToEquivalences } from '@/lib/utils/equivalences'
import { REFERENCES } from '@/lib/utils/constants'

describe('convertToEquivalences', () => {
  describe('with 1_518_000', () => {
    const result = convertToEquivalences(1_518_000)

    it('calculates salarios minimos', () => {
      expect(result.salariosMinimos).toBe(Math.floor(1_518_000 / REFERENCES.salarioMinimo))
    })

    it('calculates cestas basicas', () => {
      expect(result.cestasBasicas).toBe(Math.floor(1_518_000 / REFERENCES.cestaBasica))
    })

    it('calculates escolas FNDE', () => {
      expect(result.escolasFNDE).toBe(Math.floor(1_518_000 / REFERENCES.escolaFNDE))
    })

    it('calculates kits escolares', () => {
      expect(result.kitsEscolares).toBe(Math.floor(1_518_000 / REFERENCES.kitEscolar))
    })

    it('calculates consultas SUS', () => {
      expect(result.consultasSUS).toBe(Math.floor(1_518_000 / REFERENCES.consultaSUS))
    })

    it('calculates ambulancias UTI', () => {
      expect(result.ambulanciasUTI).toBe(Math.floor(1_518_000 / REFERENCES.ambulanciaUTI))
    })

    it('calculates respiradores UTI', () => {
      expect(result.respiradoresUTI).toBe(Math.floor(1_518_000 / REFERENCES.respiradorUTI))
    })

    it('calculates merendas', () => {
      expect(result.merendas).toBe(Math.floor(1_518_000 / REFERENCES.merenda))
    })

    it('calculates casas populares', () => {
      expect(result.casasPopulares).toBe(Math.floor(1_518_000 / REFERENCES.casaPopular))
    })

    it('calculates cirurgias cardiacas', () => {
      expect(result.cirurgiasCardiacas).toBe(Math.floor(1_518_000 / REFERENCES.cirurgiaCardiaca))
    })

    it('calculates per capita', () => {
      const expected = Number((1_518_000 / REFERENCES.populacaoBR).toFixed(4))
      expect(result.perCapita).toBe(expected)
    })
  })

  describe('edge cases', () => {
    it('returns all zeros for value 0', () => {
      const result = convertToEquivalences(0)

      expect(result.salariosMinimos).toBe(0)
      expect(result.cestasBasicas).toBe(0)
      expect(result.escolasFNDE).toBe(0)
      expect(result.kitsEscolares).toBe(0)
      expect(result.consultasSUS).toBe(0)
      expect(result.ambulanciasUTI).toBe(0)
      expect(result.respiradoresUTI).toBe(0)
      expect(result.merendas).toBe(0)
      expect(result.casasPopulares).toBe(0)
      expect(result.cirurgiasCardiacas).toBe(0)
      expect(result.perCapita).toBe(0)
    })

    it('returns all zeros for negative values', () => {
      const result = convertToEquivalences(-1000)

      expect(result.salariosMinimos).toBe(0)
      expect(result.cestasBasicas).toBe(0)
      expect(result.merendas).toBe(0)
      expect(result.perCapita).toBe(0)
    })

    it('handles very large numbers', () => {
      const result = convertToEquivalences(1_000_000_000_000)

      expect(result.salariosMinimos).toBe(Math.floor(1_000_000_000_000 / REFERENCES.salarioMinimo))
      expect(result.perCapita).toBe(Number((1_000_000_000_000 / REFERENCES.populacaoBR).toFixed(4)))
    })
  })
})
