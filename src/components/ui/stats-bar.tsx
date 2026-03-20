interface StatsBarItem {
  readonly label: string
  readonly value: string
  readonly bgClass: string
  readonly textClass: string
}

interface StatsBarProps {
  readonly items: ReadonlyArray<StatsBarItem>
}

export function StatsBar({ items }: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
      {items.map((item) => (
        <div key={item.label} className={`p-6 ${item.bgClass} ${item.textClass}`}>
          <span className="block text-xs uppercase tracking-widest font-label">
            {item.label}
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
