import { MaterialIcon } from '@/components/icons/material-icon'

type PodiumPosition = 1 | 2 | 3

interface PodiumCardProps {
  readonly position: PodiumPosition
  readonly orgao: string
  readonly category: string
  readonly value: string
  readonly equivalence: string
  readonly icon: string
}

const POSITION_CONFIG: Record<PodiumPosition, {
  wrapper: string
  badgeBg: string
  badgeText: string
  badgeLabel: string
}> = {
  1: {
    wrapper: 'scale-105 shadow-2xl border-x-8 border-secondary-container bg-white',
    badgeBg: 'bg-yellow-400',
    badgeText: 'text-yellow-950',
    badgeLabel: 'LIDER DA SEMANA',
  },
  2: {
    wrapper: 'bg-surface-container-low',
    badgeBg: 'bg-tertiary-container',
    badgeText: 'text-on-tertiary-container',
    badgeLabel: '#02',
  },
  3: {
    wrapper: 'bg-surface-container-low',
    badgeBg: 'bg-emerald-800',
    badgeText: 'text-white',
    badgeLabel: '#03',
  },
}

export function PodiumCard({
  position,
  orgao,
  category,
  value,
  equivalence,
  icon,
}: PodiumCardProps) {
  const config = POSITION_CONFIG[position]

  return (
    <div className={`relative p-6 flex flex-col gap-4 hard-shadow ${config.wrapper}`}>
      <span
        className={`absolute top-3 right-3 px-3 py-1 font-label font-black text-xs uppercase ${config.badgeBg} ${config.badgeText}`}
      >
        {config.badgeLabel}
      </span>

      <div className="flex items-center justify-center w-14 h-14 bg-surface-container">
        <MaterialIcon icon={icon} size={32} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-base font-black uppercase font-headline">{orgao}</span>
        <span className="text-xs uppercase text-on-surface-variant font-label">
          {category}
        </span>
      </div>

      <span className="text-3xl font-black tracking-tighter font-headline">
        {value}
      </span>

      <span className="text-xs italic text-on-surface-variant font-body">
        {equivalence}
      </span>
    </div>
  )
}
