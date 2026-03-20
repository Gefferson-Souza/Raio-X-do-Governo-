import Link from "next/link"

const FOOTER_LINKS = [
  { href: "#", label: "Termos de Uso", external: false },
  { href: "#", label: "Privacidade", external: false },
  { href: "https://portaldatransparencia.gov.br/api-de-dados", label: "API do Governo", external: true },
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
          {FOOTER_LINKS.map(({ href, label, external }) => (
            external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-label text-xs uppercase tracking-wider text-white/70 hover:text-white transition-colors"
              >
                {label}
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                className="font-label text-xs uppercase tracking-wider text-white/70 hover:text-white transition-colors"
              >
                {label}
              </Link>
            )
          ))}
        </nav>
      </div>
    </footer>
  )
}
