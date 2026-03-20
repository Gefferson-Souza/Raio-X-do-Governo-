import { MaterialIcon } from '@/components/icons/material-icon'

type BadgeVariant = 'auditado' | 'verificado' | 'suspeito' | 'pendente' | 'pago'

interface BadgeProps {
  readonly variant: BadgeVariant
  readonly className?: string
  readonly rotated?: boolean
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; icon?: string }> = {
  auditado: {
    bg: 'bg-secondary-container text-on-secondary-container',
    icon: 'verified',
  },
  verificado: {
    bg: 'bg-secondary-container text-on-secondary-container',
    icon: 'verified',
  },
  suspeito: {
    bg: 'bg-error-container text-on-error-container',
  },
  pendente: {
    bg: 'bg-surface-container-high text-on-surface-variant',
  },
  pago: {
    bg: 'bg-tertiary-container text-on-tertiary-container',
  },
}

export function Badge({ variant, className = '', rotated = false }: BadgeProps) {
  const style = VARIANT_STYLES[variant]
  const rotatedClass = rotated ? 'absolute rotate-12' : ''

  return (
    <span
      className={`inline-flex items-center gap-1 font-label font-black text-xs uppercase px-3 py-1 ${style.bg} ${rotatedClass} ${className}`}
    >
      {style.icon && <MaterialIcon icon={style.icon} size={14} filled />}
      {variant}
    </span>
  )
}
