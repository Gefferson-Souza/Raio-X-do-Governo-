'use client'

import { useState, useEffect } from 'react'

interface LastUpdatedProps {
  readonly updatedAt: string
}

function getRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'agora mesmo'
  if (diffMin === 1) return 'ha 1 minuto'
  if (diffMin < 60) return `ha ${diffMin} minutos`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours === 1) return 'ha 1 hora'
  return `ha ${diffHours} horas`
}

export function LastUpdated({ updatedAt }: LastUpdatedProps) {
  const [relative, setRelative] = useState('')

  useEffect(() => {
    setRelative(getRelativeTime(updatedAt))
    const interval = setInterval(() => {
      setRelative(getRelativeTime(updatedAt))
    }, 30_000)
    return () => clearInterval(interval)
  }, [updatedAt])

  if (!relative) return null

  return (
    <span className="inline-flex items-center gap-1 text-xs font-label text-emerald-300 uppercase tracking-wider">
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 14 }}
        aria-hidden="true"
      >
        update
      </span>
      Atualizado {relative}
    </span>
  )
}
