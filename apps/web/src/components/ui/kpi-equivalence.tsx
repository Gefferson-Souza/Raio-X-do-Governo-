import { MaterialIcon } from '@/components/icons/material-icon'

interface KpiEquivalenceProps {
  readonly icon: string
  readonly label: string
  readonly value: string
  readonly description?: string
  readonly iconBgColor?: string
  readonly iconTextColor?: string
}

export function KpiEquivalence({
  icon,
  label,
  value,
  description,
  iconBgColor = 'bg-primary',
  iconTextColor = 'text-on-primary',
}: KpiEquivalenceProps) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`flex items-center justify-center w-12 h-12 shrink-0 ${iconBgColor} ${iconTextColor}`}
      >
        <MaterialIcon icon={icon} size={28} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold uppercase text-on-surface-variant font-label">
          {label}
        </span>
        <span className="text-2xl font-black font-headline">{value}</span>
        {description && (
          <span className="text-xs italic text-on-surface-variant font-body">
            {description}
          </span>
        )}
      </div>
    </div>
  )
}
