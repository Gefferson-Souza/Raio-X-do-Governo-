import Link from "next/link"

const FOOTER_LINKS = [
  { href: "/termos", label: "Termos de Uso" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/api", label: "API do Governo" },
] as const

export function Footer() {
  return (
    <footer className="bg-blue-900 border-t-2 border-yellow-500 py-8 px-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="font-headline font-black italic uppercase text-yellow-400 text-lg tracking-wide">
          RAIO-X DO GOVERNO
        </span>

        <p className="font-body text-sm text-white/70 text-center">
          &copy; {new Date().getFullYear()} Raio-X do Governo. Dados abertos do
          Portal da Transparência.
        </p>

        <nav className="flex items-center gap-6">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-label text-xs uppercase tracking-wider text-white/70 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
