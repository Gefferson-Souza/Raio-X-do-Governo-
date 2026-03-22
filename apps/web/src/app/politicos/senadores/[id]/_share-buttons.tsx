'use client'

import { useCallback } from 'react'
import { MaterialIcon } from '@/components/icons/material-icon'
import { shareOnWhatsApp, shareOnTwitter } from '@/lib/utils/share'
import { humanizeNumber } from '@/lib/utils/format'

interface ShareButtonsProps {
  readonly nome: string
  readonly partido: string
  readonly uf: string
  readonly totalGasto: number
  readonly senatorId: number
}

export function ShareButtons({
  nome,
  partido,
  uf,
  totalGasto,
  senatorId,
}: ShareButtonsProps) {
  const shareText = `O senador ${nome} (${partido}-${uf}) gastou ${humanizeNumber(totalGasto)} da cota parlamentar. Veja no Raio-X do Governo:`

  const handleWhatsApp = useCallback(() => {
    const url = `${window.location.origin}/politicos/senadores/${senatorId}`
    shareOnWhatsApp(shareText, url)
  }, [shareText, senatorId])

  const handleTwitter = useCallback(() => {
    const url = `${window.location.origin}/politicos/senadores/${senatorId}`
    shareOnTwitter(shareText, url)
  }, [shareText, senatorId])

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={handleWhatsApp}
        className="inline-flex items-center gap-2 bg-emerald-700 text-white font-label font-bold uppercase tracking-wider px-5 py-3 text-sm hover:opacity-90 transition-opacity"
      >
        <MaterialIcon icon="share" size={18} />
        WHATSAPP
      </button>
      <button
        type="button"
        onClick={handleTwitter}
        className="inline-flex items-center gap-2 bg-sky-600 text-white font-label font-bold uppercase tracking-wider px-5 py-3 text-sm hover:opacity-90 transition-opacity"
      >
        <MaterialIcon icon="share" size={18} />
        TWITTER
      </button>
    </div>
  )
}
