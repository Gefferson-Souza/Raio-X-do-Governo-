import { ExecutionBar } from './execution-bar'

interface StatsBarProps {
  readonly totalPago: string
  readonly executionPercent: number
  readonly isError?: boolean
}

export function StatsBar({ totalPago, executionPercent, isError = false }: StatsBarProps) {
  return (
    <div className="bg-emerald-900 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="block text-xs uppercase tracking-widest font-label text-emerald-300 mb-1">
            TOTAL GASTO PELO GOVERNO
          </span>
          <span className="block text-4xl md:text-5xl font-black tracking-tighter font-headline text-white">
            {isError ? 'INDISPONIVEL' : totalPago}
          </span>
        </div>
        {!isError && <ExecutionBar percent={executionPercent} />}
      </div>
    </div>
  )
}
