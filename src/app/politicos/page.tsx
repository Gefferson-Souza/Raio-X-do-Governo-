import { getPoliticiansData } from '@/lib/services/politicians-service'
import { PoliticiansContent, PoliticiansBody } from '@/components/ui/politicians-content'

export const revalidate = 3600

export default async function PoliticosPage() {
  const data = await getPoliticiansData()

  return (
    <div className="pb-12 lg:pl-8 px-4 md:px-8">
      {/* Hero section (server-rendered shell) */}
      <section className="bg-emerald-900 p-8 md:p-12 -mx-4 md:-mx-8 lg:mx-0">
        <span className="inline-block bg-yellow-400 text-emerald-950 px-4 py-1 font-label text-xs font-bold uppercase tracking-widest mb-6">
          DADOS ABERTOS — CAMARA + SENADO + PORTAL DA TRANSPARENCIA
        </span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-headline text-white">
          RAIO-X DOS POLITICOS
        </h1>

        {/* Client component: fetches from /api/politicians if SSR cache is empty */}
        <PoliticiansContent initialData={data} />
      </section>

      {/* Client component: all data-driven sections */}
      <PoliticiansBody initialData={data} />
    </div>
  )
}
