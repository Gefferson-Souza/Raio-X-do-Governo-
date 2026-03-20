"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MaterialIcon } from "@/components/icons/material-icon"

interface BottomNavItem {
  readonly href: string
  readonly icon: string
  readonly label: string
  readonly isFab?: boolean
}

const BOTTOM_ITEMS: readonly BottomNavItem[] = [
  { href: "/dossies", icon: "folder_open", label: "Dossiês" },
  { href: "/gastos", icon: "payments", label: "Gastos" },
  { href: "/denunciar", icon: "campaign", label: "Denunciar", isFab: true },
  { href: "/mapa", icon: "map", label: "Mapa" },
  { href: "/config", icon: "settings", label: "Config" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-emerald-900 z-50 flex items-center justify-around px-2">
      {BOTTOM_ITEMS.map(({ href, icon, label, isFab }) => {
        const isActive = pathname.startsWith(href)

        if (isFab) {
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center -mt-8"
              aria-label={label}
            >
              <span className="w-14 h-14 bg-yellow-400 flex items-center justify-center shadow-lg">
                <MaterialIcon
                  icon={icon}
                  className="text-emerald-900"
                  size={28}
                />
              </span>
              <span className="font-label text-[10px] uppercase tracking-wider text-yellow-400 mt-1">
                {label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5"
            aria-label={label}
          >
            <MaterialIcon
              icon={icon}
              filled={isActive}
              className={isActive ? "text-yellow-400" : "text-white/70"}
              size={24}
            />
            <span
              className={`font-label text-[10px] uppercase tracking-wider ${
                isActive ? "text-yellow-400" : "text-white/70"
              }`}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
