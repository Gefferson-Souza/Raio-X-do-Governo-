import { MaterialIcon } from '@/components/icons/material-icon'
import { Badge } from '@/components/ui/badge'

interface ContractCardProps {
  readonly icon: string
  readonly title: string
  readonly description: string
  readonly value: string
  readonly category: string
  readonly status: string
  readonly borderColor?: string
}

export function ContractCard({
  icon,
  title,
  description,
  value,
  category,
  status,
  borderColor = 'border-primary',
}: ContractCardProps) {
  return (
    <div
      className={`relative bg-surface border-t-8 ${borderColor} hard-shadow p-6 flex flex-col gap-4`}
    >
      <Badge variant="auditado" rotated className="top-3 right-3 z-10" />

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-surface-container">
          <MaterialIcon icon={icon} size={24} />
        </div>
        <span className="text-2xl font-black font-headline">{value}</span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-base font-black uppercase font-headline">{title}</h3>
        <p className="text-sm text-on-surface-variant font-body">{description}</p>
      </div>

      <span className="text-xs uppercase font-label text-on-surface-variant">
        {category}
      </span>

      <div className="mt-auto pt-4 border-t border-outline-variant">
        <span className="text-xs font-bold uppercase font-label text-on-surface-variant">
          {status}
        </span>
      </div>
    </div>
  )
}
