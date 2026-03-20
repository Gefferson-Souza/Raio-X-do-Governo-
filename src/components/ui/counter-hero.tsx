'use client'

import { useEffect } from 'react'
import { useMotionValue, useTransform, animate, motion } from 'framer-motion'
import { formatBRL } from '@/lib/utils/format'
import { MaterialIcon } from '@/components/icons/material-icon'

interface CounterHeroProps {
  readonly value: number
  readonly label: string
  readonly source: string
}

export function CounterHero({ value, label, source }: CounterHeroProps) {
  const motionValue = useMotionValue(0)
  const displayed = useTransform(motionValue, (current) => formatBRL(current))

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 2,
      ease: 'easeOut',
    })
    return controls.stop
  }, [motionValue, value])

  return (
    <div className="bg-emerald-900 p-6 md:p-12 flex flex-col gap-4 items-center lg:items-start text-center lg:text-left">
      <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-3">
        <motion.span className="font-label text-4xl sm:text-5xl lg:text-9xl font-black tracking-tighter text-yellow-400 break-all lg:break-normal">
          {displayed}
        </motion.span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xl font-bold uppercase text-white font-headline">
          {label}
        </span>
        <span className="inline-flex items-center gap-1 bg-green-400 text-green-950 px-2 py-0.5 font-label font-black text-xs uppercase">
          <MaterialIcon icon="verified" size={14} filled />
          verificado
        </span>
      </div>

      <span className="text-sm text-emerald-300 font-body">
        Fonte: {source}
      </span>
    </div>
  )
}
