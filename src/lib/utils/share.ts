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

export async function downloadOgImage(
  ogUrl: string,
  filename: string = 'raio-x-do-governo.png',
): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  const res = await fetch(ogUrl, { signal: controller.signal })
  clearTimeout(timeout)
  if (!res.ok) throw new Error('Failed to download image')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    URL.revokeObjectURL(url)
  }
}
