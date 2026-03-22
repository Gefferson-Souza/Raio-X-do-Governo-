'use client'

import { useCallback } from 'react'
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'
import { useQuery } from '@tanstack/react-query'
import { PoliticianSearch } from '@/components/ui/politician-search'
import { PoliticianFilters } from '@/components/ui/politician-filters'
import { PoliticianCard } from '@/components/ui/politician-card'
import { PoliticianPagination } from '@/components/ui/politician-pagination'
import { MaterialIcon } from '@/components/icons/material-icon'

interface SearchResult {
  readonly externalId: number
  readonly nome: string
  readonly partido: string
  readonly uf: string
  readonly house: string
  readonly totalGasto: number
  readonly foto: string
}

interface SearchResponse {
  readonly data: readonly SearchResult[]
  readonly total: number
  readonly page: number
  readonly totalPages: number
}

const CURRENT_YEAR = new Date().getFullYear().toString()
const ITEMS_PER_PAGE = 20

function buildSearchUrl(params: {
  q: string
  casa: string
  ano: string
  ordem: string
  pagina: number
}): string {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.set('q', params.q)
  if (params.casa) searchParams.set('house', params.casa)
  searchParams.set('year', params.ano)
  searchParams.set('sort', params.ordem)
  searchParams.set('page', String(params.pagina))
  searchParams.set('limit', String(ITEMS_PER_PAGE))
  return `/api/v1/politicians/search?${searchParams.toString()}`
}

export function PoliticiansHub() {
  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''))
  const [casa, setCasa] = useQueryState('casa', parseAsString.withDefault(''))
  const [ano, setAno] = useQueryState('ano', parseAsString.withDefault(CURRENT_YEAR))
  const [ordem, setOrdem] = useQueryState('ordem', parseAsString.withDefault('spending_desc'))
  const [pagina, setPagina] = useQueryState('pagina', parseAsInteger.withDefault(1))

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  const { data, isFetching, isError } = useQuery<SearchResponse>({
    queryKey: ['politicians-search', q, casa, ano, ordem, pagina],
    queryFn: async () => {
      const url = buildSearchUrl({ q, casa, ano, ordem, pagina })
      const res = await fetch(`${apiUrl}${url}`)
      if (!res.ok) throw new Error(`Search failed: ${res.status}`)
      return res.json()
    },
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
  })

  const handleSearchChange = useCallback(
    (value: string) => {
      setQ(value || null)
      setPagina(1)
    },
    [setQ, setPagina],
  )

  const handleHouseChange = useCallback(
    (value: string) => {
      setCasa(value || null)
      setPagina(1)
    },
    [setCasa, setPagina],
  )

  const handleYearChange = useCallback(
    (value: string) => {
      setAno(value)
      setPagina(1)
    },
    [setAno, setPagina],
  )

  const handleSortChange = useCallback(
    (value: string) => {
      setOrdem(value)
      setPagina(1)
    },
    [setOrdem, setPagina],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      setPagina(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [setPagina],
  )

  const results = data?.data ?? []
  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.page ?? pagina

  return (
    <div className="mt-8 flex flex-col gap-6">
      <PoliticianSearch value={q} onChange={handleSearchChange} />
      <PoliticianFilters
        selectedHouse={casa}
        selectedYear={ano}
        selectedSort={ordem}
        onHouseChange={handleHouseChange}
        onYearChange={handleYearChange}
        onSortChange={handleSortChange}
      />

      {/* Loading */}
      {isFetching && results.length === 0 && (
        <div className="bg-surface-container border-2 border-outline-variant p-8 text-center">
          <div className="inline-block animate-spin mb-4">
            <MaterialIcon icon="progress_activity" size={48} className="text-primary" />
          </div>
          <h3 className="font-headline font-black uppercase text-xl">BUSCANDO POLITICOS...</h3>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-surface-container border-2 border-error/30 p-8 text-center">
          <MaterialIcon icon="cloud_off" size={48} className="text-error/50" />
          <h3 className="font-headline font-black uppercase text-xl mt-4">ERRO AO BUSCAR DADOS</h3>
          <p className="font-body text-on-surface-variant mt-2">
            Nao foi possivel consultar os politicos neste momento. Tente novamente.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isFetching && !isError && results.length === 0 && (
        <div className="bg-surface-container border-2 border-outline-variant p-8 text-center">
          <MaterialIcon icon="search_off" size={48} className="text-on-surface-variant/30" />
          <h3 className="font-headline font-black uppercase text-xl mt-4">NENHUM RESULTADO</h3>
          <p className="font-body text-on-surface-variant mt-2">
            Nenhum politico encontrado com os filtros selecionados.
          </p>
        </div>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div className="border-2 border-outline-variant bg-white flex flex-col">
          {results.map((politician, index) => (
            <PoliticianCard
              key={`${politician.house}-${politician.externalId}-${index}`}
              id={politician.externalId}
              position={(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
              nome={politician.nome}
              partido={politician.partido}
              uf={politician.uf}
              house={politician.house}
              totalGasto={politician.totalGasto}
              foto={politician.foto}
              year={Number(ano)}
            />
          ))}
        </div>
      )}

      <PoliticianPagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Source footer */}
      <p className="text-xs font-label text-on-surface-variant uppercase tracking-widest text-center mt-4">
        Fonte: Camara dos Deputados + Senado Federal | Periodo: Jan-Dez {ano}
      </p>
    </div>
  )
}
