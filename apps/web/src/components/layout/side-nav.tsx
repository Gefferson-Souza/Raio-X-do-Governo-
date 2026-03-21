"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MaterialIcon } from "@/components/icons/material-icon"

const NAV_ITEMS = [
  { href: "/", icon: "home", label: "Painel da Verdade" },
  { href: "/ranking", icon: "leaderboard", label: "Ranking de Gastos" },
  { href: "/politicos", icon: "how_to_reg", label: "Politicos" },
  { href: "/carrinho", icon: "shopping_cart", label: "Contratos" },
  { href: "/gerador", icon: "bolt", label: "Gerador de Impacto" },
] as const

export function SideNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex fixed left-0 top-20 h-[calc(100vh-80px)] w-72 bg-slate-100 flex-col border-r border-slate-200 z-40">
      <div className="px-6 py-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-900 flex items-center justify-center">
            <MaterialIcon icon="shield" className="text-yellow-400" size={24} />
          </div>
          <div>
            <p className="font-label text-xs font-medium uppercase tracking-wider text-emerald-800">
              AUDITOR CIDADÃO
            </p>
            <p className="font-body text-xs text-slate-500">
              Fiscalização ativa
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 font-label text-sm font-medium uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-yellow-400 text-emerald-900"
                  : "text-emerald-800 hover:bg-emerald-200"
              }`}
            >
              <MaterialIcon icon={icon} filled={isActive} size={22} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-6 border-t border-slate-200">
        <a
          href="https://falabr.cgu.gov.br"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-error text-white font-label text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <MaterialIcon icon="campaign" size={20} />
          DENUNCIAR GASTO
        </a>
      </div>
    </aside>
  )
}
