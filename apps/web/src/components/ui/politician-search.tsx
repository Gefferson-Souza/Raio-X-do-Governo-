'use client'

import { useState, useEffect, useCallback } from 'react'
import { MaterialIcon } from '@/components/icons/material-icon'

interface PoliticianSearchProps {
  readonly value: string
  readonly onChange: (value: string) => void
}

export function PoliticianSearch({ value, onChange }: PoliticianSearchProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localValue, value, onChange])

  const handleClear = useCallback(() => {
    setLocalValue('')
    onChange('')
  }, [onChange])

  return (
    <div className="relative">
      <MaterialIcon
        icon="search"
        size={20}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="BUSCAR POLITICO POR NOME..."
        className="w-full border-2 border-outline-variant bg-surface-container px-10 py-3 font-label text-sm uppercase tracking-wider text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
      />
      {localValue.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
          aria-label="Limpar busca"
        >
          <MaterialIcon icon="close" size={20} />
        </button>
      )}
    </div>
  )
}
