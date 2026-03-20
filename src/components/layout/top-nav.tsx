"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MaterialIcon } from "@/components/icons/material-icon"

const NAV_LINKS = [
  { href: "/gastos", label: "GASTOS REAIS" },
  { href: "/dossies", label: "DOSSIÊS" },
  { href: "/mapa", label: "MAPA" },
] as const

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 w-full h-20 bg-emerald-900 border-b-4 border-yellow-500 z-50 flex items-center justify-between px-6 lg:px-8">
      <Link href="/" className="flex items-center">
        <span className="font-headline font-black italic uppercase text-white text-xl tracking-wide">
          RAIO-X DO GOVERNO
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 h-20 flex items-center font-label text-sm font-medium uppercase tracking-wider transition-colors ${
                isActive
                  ? "text-yellow-400 border-b-4 border-yellow-400"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Buscar"
          className="text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          <MaterialIcon icon="search" size={28} />
        </button>
        <button
          type="button"
          aria-label="Notificações"
          className="text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          <MaterialIcon icon="notifications" size={28} />
        </button>
      </div>
    </header>
  )
}
