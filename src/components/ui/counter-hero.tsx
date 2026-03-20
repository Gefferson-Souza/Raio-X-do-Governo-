'use client'

import { useEffect } from 'react'
import { useMotionValue, useTransform, animate, motion } from 'framer-motion'
import { humanizeNumber } from '@/lib/utils/format'
import { MaterialIcon } from '@/components/icons/material-icon'

const TRILLION = 1_000_000_000_000

interface CounterHeroProps {
  readonly value: number
  readonly label: string
  readonly source: string
}

export function CounterHero({ value, label, source }: CounterHeroProps) {
  const isTrillion = value >= TRILLION
  const motionValue = useMotionValue(0)
  const displayed = useTransform(motionValue, (current) => humanizeNumber(current))

  useEffect(() => {
    if (isTrillion) {
      // At trillion scale the counting animation is meaningless — show final value immediately
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, {
      duration: 2,
      ease: 'easeOut',
    })
    return controls.stop
  }, [motionValue, value, isTrillion])

  return (
    <div className="bg-emerald-900 p-6 md:p-12 flex flex-col gap-4 items-center lg:items-start text-center lg:text-left">
      <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-3 max-w-full overflow-hidden">
        <motion.span className="font-label text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-yellow-400 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
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
