export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value).replace(/\u00A0/g, ' ')
}

export function humanizeNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `R$ ${(value / 1_000_000_000_000).toFixed(1).replace('.', ',')} trilhoes`
  }
  if (value >= 1_000_000_000) {
    return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} bilhoes`
  }
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')} milhoes`
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')} mil`
  }
  return formatBRL(value)
}
