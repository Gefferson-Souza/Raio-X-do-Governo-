import { Badge } from '@/components/ui/badge'

type BadgeVariant = 'auditado' | 'verificado' | 'suspeito' | 'pendente' | 'pago'

interface TimelineRowProps {
  readonly time: string
  readonly orgao: string
  readonly description: string
  readonly value: string
  readonly status: string
  readonly isSuspect?: boolean
}

function resolveStatusVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase().trim()
  if (normalized === 'auditado') return 'auditado'
  if (normalized === 'verificado') return 'verificado'
  if (normalized === 'suspeito') return 'suspeito'
  if (normalized === 'pago') return 'pago'
  return 'pendente'
}

export function TimelineRow({
  time,
  orgao,
  description,
  value,
  status,
  isSuspect = false,
}: TimelineRowProps) {
  const borderClass = isSuspect ? 'border-l-4 border-error' : ''
  const timeColor = isSuspect ? 'text-error' : 'text-on-surface'

  return (
    <div
      className={`flex items-center gap-4 py-3 px-2 ${borderClass}`}
    >
      <div className="flex items-center justify-center w-12 h-12 bg-zinc-100 shrink-0">
        <span className={`text-sm font-black font-label ${timeColor}`}>
          {time}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-bold uppercase font-label truncate">
          {orgao}
        </span>
        <span className="text-xs text-on-surface-variant font-body truncate">
          {description}
        </span>
      </div>

      <span className="text-xl font-black font-headline shrink-0">{value}</span>

      <Badge variant={resolveStatusVariant(status)} />
    </div>
  )
}
