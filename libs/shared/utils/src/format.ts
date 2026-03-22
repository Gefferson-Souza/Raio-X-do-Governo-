export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value).replace(/\u00A0/g, ' ')
}

function humanize(value: number, prefix: string): string {
  if (value >= 1_000_000_000_000) {
    return `${prefix}${(value / 1_000_000_000_000).toFixed(1).replace('.', ',')} trilhoes`
  }
  if (value >= 1_000_000_000) {
    return `${prefix}${(value / 1_000_000_000).toFixed(1).replace('.', ',')} bilhoes`
  }
  if (value >= 1_000_000) {
    return `${prefix}${(value / 1_000_000).toFixed(1).replace('.', ',')} milhoes`
  }
  if (value >= 1_000) {
    return `${prefix}${(value / 1_000).toFixed(1).replace('.', ',')} mil`
  }
  return ''
}

export function humanizeNumber(value: number): string {
  return humanize(value, 'R$ ') || formatBRL(value)
}

export function humanizeCount(value: number): string {
  return humanize(value, '') || value.toLocaleString('pt-BR')
}

export function parseBRNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value !== 'string' || value === '-' || value === '') return 0
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

export function formatDateBR(isoDate: string | null | undefined): string {
  if (!isoDate) return 'N/A'
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}
