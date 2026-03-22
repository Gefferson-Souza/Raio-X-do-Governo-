import { formatBRL } from '@/lib/utils/format'

interface ExpenseItem {
  readonly tipo: string
  readonly total: number
}

interface ExpenseBreakdownProps {
  readonly data: readonly ExpenseItem[]
  readonly title?: string
  readonly subtitle?: string
}

export function ExpenseBreakdown({ data, title, subtitle }: ExpenseBreakdownProps) {
  if (data.length === 0) {
    return null
  }

  const maxValue = data.reduce(
    (max, item) => (item.total > max ? item.total : max),
    0,
  )

  if (maxValue <= 0) {
    return null
  }

  return (
    <section>
      {title && (
        <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface mb-2">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="font-body text-sm text-on-surface-variant mb-6">
          {subtitle}
        </p>
      )}
      <div className="flex flex-col gap-4">
        {data.map((item) => {
          const percent = (item.total / maxValue) * 100
          return (
            <div key={item.tipo} className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline gap-4">
                <span className="font-label text-sm font-bold text-on-surface truncate">
                  {item.tipo}
                </span>
                <span className="font-headline font-black text-base text-error whitespace-nowrap">
                  {formatBRL(item.total)}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.round(percent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.tipo}: ${Math.round(percent)}%`}
                className="h-3 bg-surface-container-highest rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
