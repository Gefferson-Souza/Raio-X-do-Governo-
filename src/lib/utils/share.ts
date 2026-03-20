export function buildShareUrl(
  baseUrl: string,
  item: string,
  valor: string,
  equivalencia: string,
): string {
  const params = new URLSearchParams({
    item,
    valor,
    equivalencia,
  })
  return `${baseUrl}/gerador?${params.toString()}`
}

export function buildOgImageUrl(
  baseUrl: string,
  item: string,
  valor: string,
  equivalencia: string,
): string {
  const params = new URLSearchParams({
    item,
    valor,
    equivalencia,
  })
  return `${baseUrl}/api/og?${params.toString()}`
}

export function shareOnWhatsApp(text: string, url: string): void {
  const fullText = `${text}\n\n${url}`
  window.open(
    `https://wa.me/?text=${encodeURIComponent(fullText)}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export function shareOnTwitter(text: string, url: string): void {
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export async function shareNative(data: {
  title: string
  text: string
  url: string
}): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data)
      return true
    } catch {
      return false
    }
  }
  return false
}

export async function downloadOgImage(
  ogUrl: string,
  filename: string = 'raio-x-do-governo.png',
): Promise<void> {
  const res = await fetch(ogUrl)
  if (!res.ok) throw new Error('Failed to download image')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
