import { MaterialIcon } from '@/components/icons/material-icon'

interface CtaBannerProps {
  readonly title: string
  readonly subtitle: string
  readonly buttonText: string
  readonly buttonHref?: string
}

export function CtaBanner({
  title,
  subtitle,
  buttonText,
  buttonHref = '#',
}: CtaBannerProps) {
  return (
    <div className="relative overflow-hidden bg-blue-950 text-white p-12 border-l-[16px] border-yellow-400">
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
        <MaterialIcon icon="search" size={240} />
      </div>

      <div className="relative z-10 flex flex-col gap-6 max-w-2xl">
        <h2 className="text-4xl font-black uppercase italic font-headline">
          {title}
        </h2>
        <p className="text-lg font-body">{subtitle}</p>
        <a
          href={buttonHref}
          className="inline-block w-fit bg-white text-blue-950 font-black uppercase px-8 py-4 hard-shadow font-label hover:opacity-90 transition-opacity"
        >
          {buttonText}
        </a>
      </div>
    </div>
  )
}
