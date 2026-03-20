import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shareOnWhatsApp, shareOnTwitter, downloadOgImage } from '@/lib/utils/share'

describe('shareOnWhatsApp', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { open: vi.fn() })
  })

  it('opens WhatsApp with encoded text and URL', () => {
    shareOnWhatsApp('Teste de mensagem', 'https://example.com')
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/?text='),
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('encodes special characters in the message', () => {
    shareOnWhatsApp('R$ 1.000,00 com acentuação', 'https://example.com')
    const call = vi.mocked(window.open).mock.calls[0][0] as string
    expect(call).toContain('wa.me')
    expect(call).not.toContain(' ')
  })
})

describe('shareOnTwitter', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { open: vi.fn() })
  })

  it('opens Twitter intent with text and URL', () => {
    shareOnTwitter('Veja os gastos', 'https://example.com')
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('encodes text and URL separately', () => {
    shareOnTwitter('Texto', 'https://example.com/path?q=1')
    const call = vi.mocked(window.open).mock.calls[0][0] as string
    expect(call).toContain('text=Texto')
    expect(call).toContain('url=')
  })
})

describe('downloadOgImage', () => {
  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(downloadOgImage('/api/og?test=1')).rejects.toThrow('Failed to download image')
  })

  it('creates and clicks a download link', async () => {
    const mockBlob = new Blob(['test'])
    const mockUrl = 'blob:test-url'
    const mockAnchor = { href: '', download: '', click: vi.fn() }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    }))
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue(mockUrl),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as HTMLElement)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as HTMLElement)

    await downloadOgImage('/api/og?test=1', 'test.png')

    expect(mockAnchor.download).toBe('test.png')
    expect(mockAnchor.click).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl)
  })
})
