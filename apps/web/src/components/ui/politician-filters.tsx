'use client'

import { MaterialIcon } from '@/components/icons/material-icon'

interface PoliticianFiltersProps {
  readonly selectedHouse: string
  readonly selectedYear: string
  readonly selectedSort: string
  readonly onHouseChange: (house: string) => void
  readonly onYearChange: (year: string) => void
  readonly onSortChange: (sort: string) => void
}

const HOUSE_OPTIONS = [
  { value: '', label: 'TODOS' },
  { value: 'camara', label: 'CAMARA' },
  { value: 'senado', label: 'SENADO' },
] as const

const YEAR_OPTIONS = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
] as const

const SORT_OPTIONS = [
  { value: 'spending_desc', label: 'MAIOR GASTO', icon: 'trending_up' },
  { value: 'name_asc', label: 'NOME A-Z', icon: 'sort_by_alpha' },
] as const

function Chip({
  label,
  active,
  icon,
  onClick,
}: {
  readonly label: string
  readonly active: boolean
  readonly icon?: string
  readonly onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 font-label text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? 'bg-primary text-on-primary'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
      }`}
    >
      {icon && <MaterialIcon icon={icon} size={16} />}
      {label}
    </button>
  )
}

export function PoliticianFilters({
  selectedHouse,
  selectedYear,
  selectedSort,
  onHouseChange,
  onYearChange,
  onSortChange,
}: PoliticianFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Casa */}
      <div>
        <span className="block font-label text-xs text-on-surface-variant uppercase tracking-widest mb-2">
          CASA
        </span>
        <div className="flex flex-wrap gap-2">
          {HOUSE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={selectedHouse === option.value}
              onClick={() => onHouseChange(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Ano */}
      <div>
        <span className="block font-label text-xs text-on-surface-variant uppercase tracking-widest mb-2">
          ANO
        </span>
        <div className="flex flex-wrap gap-2">
          {YEAR_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={selectedYear === option.value}
              onClick={() => onYearChange(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Ordenacao */}
      <div>
        <span className="block font-label text-xs text-on-surface-variant uppercase tracking-widest mb-2">
          ORDENAR POR
        </span>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              icon={option.icon}
              active={selectedSort === option.value}
              onClick={() => onSortChange(option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
