import Link from 'next/link'
import { MaterialIcon } from '@/components/icons/material-icon'
import { humanizeNumber } from '@/lib/utils/format'

interface PoliticianCardProps {
  readonly id: number
  readonly position: number
  readonly nome: string
  readonly partido: string
  readonly uf: string
  readonly house: string
  readonly totalGasto: number
  readonly foto: string
  readonly year: number
}

function resolveProfileUrl(house: string, id: number): string {
  const segment = house === 'senado' ? 'senadores' : 'deputados'
  return `/politicos/${segment}/${id}`
}

function houseBadgeStyle(house: string): string {
  return house === 'senado'
    ? 'bg-secondary-container text-on-secondary-container'
    : 'bg-primary text-on-primary'
}

export function PoliticianCard({
  id,
  position,
  nome,
  partido,
  uf,
  house,
  totalGasto,
  foto,
  year,
}: PoliticianCardProps) {
  const profileUrl = resolveProfileUrl(house, id)
  const houseLabel = house === 'senado' ? 'SENADOR' : 'DEPUTADO'

  return (
    <Link
      href={profileUrl}
      className="border-b border-outline-variant last:border-b-0 p-4 md:p-6 flex items-center gap-4 hover:bg-surface-container-low transition-colors"
    >
      <span className="font-headline font-black text-2xl text-on-surface-variant/30 w-8 text-right shrink-0">
        {position}
      </span>

      {foto ? (
        <img
          src={foto}
          alt={nome}
          className="w-12 h-12 rounded-full object-cover shrink-0 bg-surface-container"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
          <MaterialIcon icon="person" size={24} className="text-on-surface-variant/40" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <span className="font-headline font-black text-base text-on-surface block truncate">
          {nome}
        </span>
        <span className="font-label text-xs text-on-surface-variant uppercase">
          {partido}-{uf}
        </span>
        <span
          className={`inline-block mt-1 px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wider ${houseBadgeStyle(house)}`}
        >
          {houseLabel}
        </span>
      </div>

      <div className="text-right shrink-0">
        <span className="block font-headline font-black text-lg text-error">
          {humanizeNumber(totalGasto)}
        </span>
        <span className="block font-label text-[10px] text-on-surface-variant uppercase">
          COTA {year}
        </span>
      </div>

      <MaterialIcon
        icon="chevron_right"
        size={20}
        className="text-on-surface-variant/30 hidden md:block"
      />
    </Link>
  )
}
