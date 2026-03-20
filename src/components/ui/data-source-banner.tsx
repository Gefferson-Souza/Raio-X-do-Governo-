import { MaterialIcon } from '@/components/icons/material-icon'

interface DataSourceBannerProps {
  readonly source: 'live' | 'cached' | 'error'
  readonly updatedAt?: string
}

export function DataSourceBanner({ source, updatedAt }: DataSourceBannerProps) {
  if (source === 'error') {
    return (
      <div className="bg-error text-on-error p-4 flex items-center gap-3">
        <MaterialIcon icon="warning" filled className="text-xl" />
        <span className="font-label font-bold text-sm uppercase tracking-wider">
          ERRO AO CARREGAR DADOS DO PORTAL DA TRANSPARENCIA
        </span>
      </div>
    )
  }

  if (source === 'cached' && updatedAt) {
    const date = new Date(updatedAt)
    const formatted = date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    return (
      <div className="bg-secondary-container text-on-secondary-container px-4 py-2 flex items-center gap-2">
        <MaterialIcon icon="schedule" className="text-sm" />
        <span className="font-label font-bold text-xs uppercase tracking-wider">
          DADOS ATUALIZADOS EM {formatted}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-primary text-on-primary px-4 py-2 flex items-center gap-2">
      <span className="w-2 h-2 bg-on-primary rounded-full animate-pulse" />
      <span className="font-label font-bold text-xs uppercase tracking-wider">
        DADOS AO VIVO — PORTAL DA TRANSPARENCIA
      </span>
    </div>
  )
}
