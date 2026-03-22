'use client'

import { MaterialIcon } from '@/components/icons/material-icon'

interface PoliticianPaginationProps {
  readonly page: number
  readonly totalPages: number
  readonly onPageChange: (page: number) => void
}

export function PoliticianPagination({
  page,
  totalPages,
  onPageChange,
}: PoliticianPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const isFirstPage = page <= 1
  const isLastPage = page >= totalPages

  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <button
        type="button"
        disabled={isFirstPage}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-outline-variant font-label text-xs font-bold uppercase tracking-wider text-on-surface transition-colors hover:bg-surface-container-highest disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Pagina anterior"
      >
        <MaterialIcon icon="chevron_left" size={18} />
        ANTERIOR
      </button>

      <span className="font-label text-sm font-bold text-on-surface-variant uppercase tracking-wider">
        PAGINA {page} DE {totalPages}
      </span>

      <button
        type="button"
        disabled={isLastPage}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-outline-variant font-label text-xs font-bold uppercase tracking-wider text-on-surface transition-colors hover:bg-surface-container-highest disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Proxima pagina"
      >
        PROXIMA
        <MaterialIcon icon="chevron_right" size={18} />
      </button>
    </div>
  )
}
