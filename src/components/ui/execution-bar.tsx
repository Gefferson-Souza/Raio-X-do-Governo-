interface ExecutionBarProps {
  readonly percent: number
}

export function ExecutionBar({ percent }: ExecutionBarProps) {
  const clamped = Math.min(Math.round(percent), 100)

  return (
    <div className="flex flex-col gap-2 w-full md:w-72">
      <span className="text-sm font-body text-emerald-200">
        De cada R$ 100 no orcamento,{' '}
        <strong className="text-white">R$ {clamped} ja foram gastos</strong>
      </span>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${clamped}% do orcamento ja foi gasto`}
        className="h-3 bg-emerald-800 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
