"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MaterialIcon } from "@/components/icons/material-icon"

interface BottomNavItem {
  readonly href: string
  readonly icon: string
  readonly label: string
}

const NAV_ITEMS: readonly BottomNavItem[] = [
  { href: '/', icon: 'home', label: 'Início' },
  { href: '/carrinho', icon: 'payments', label: 'Gastos' },
  { href: '/ranking', icon: 'leaderboard', label: 'Ranking' },
  { href: '/gerador', icon: 'folder_shared', label: 'Dossiês' },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname.startsWith(href)
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 bg-white border-t-4 border-green-800 z-50 flex items-stretch">
      {NAV_ITEMS.map(({ href, icon, label }) => {
        const active = isActive(pathname, href)

        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${
              active
                ? 'bg-yellow-400 text-green-900 scale-105'
                : 'text-slate-500 hover:bg-slate-200'
            }`}
            aria-label={label}
          >
            <MaterialIcon
              icon={icon}
              filled={active}
              className={active ? 'text-green-900' : 'text-slate-500'}
              size={24}
            />
            <span className="font-label font-bold text-[10px] uppercase">
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
