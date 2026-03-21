import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

let fontCache: { epilogue: ArrayBuffer; spaceGrotesk: ArrayBuffer } | null = null

async function loadFonts() {
  if (fontCache) return fontCache

  const [epilogue, spaceGrotesk] = await Promise.all([
    fetch(
      'https://fonts.gstatic.com/s/epilogue/v17/O4ZMFGj5hxF0EhjimlIhqAYaY7EBcUSREF6IHBbCp0WJQ2qdlCYBer8F3vwEKHRIAx8v.woff2',
    ).then((r) => {
      if (!r.ok) throw new Error(`Font load failed: ${r.status}`)
      return r.arrayBuffer()
    }),
    fetch(
      'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2',
    ).then((r) => {
      if (!r.ok) throw new Error(`Font load failed: ${r.status}`)
      return r.arrayBuffer()
    }),
  ])

  fontCache = { epilogue, spaceGrotesk }
  return fontCache
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const valor = (searchParams.get('valor') ?? 'R$ 1.500.000,00').slice(0, 50)
  const item = (searchParams.get('item') ?? 'Gasto Publico').slice(0, 80)
  const equivalencia = (searchParams.get('equivalencia') ?? '6.000 consultas SUS').slice(0, 80)

  let fonts: { epilogue: ArrayBuffer; spaceGrotesk: ArrayBuffer }
  try {
    fonts = await loadFonts()
  } catch {
    return new Response('Font loading failed', { status: 502 })
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          fontFamily: 'Epilogue',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#065f46',
            padding: '24px 40px',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: 28,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              fontFamily: 'Epilogue',
            }}
          >
            RAIO-X DO GOVERNO
          </span>
          <span
            style={{
              color: '#6ee7b7',
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'Space Grotesk',
            }}
          >
            PORTAL DA TRANSPARENCIA
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 60px',
          }}
        >
          <span
            style={{
              fontSize: 18,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#5a5c5e',
              marginBottom: 12,
              fontFamily: 'Space Grotesk',
            }}
          >
            {item}
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: '#b02500',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              fontFamily: 'Epilogue',
            }}
          >
            {valor}
          </span>

          <div
            style={{
              width: '100%',
              borderTop: '8px solid #facc15',
              marginTop: 32,
              paddingTop: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#5a5c5e',
                marginBottom: 8,
                fontFamily: 'Space Grotesk',
              }}
            >
              O QUE ISSO REPRESENTA
            </span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: '#006a26',
                textTransform: 'uppercase',
                fontFamily: 'Epilogue',
              }}
            >
              {equivalencia}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#064e3b',
            padding: '16px 40px',
          }}
        >
          <span
            style={{
              color: '#6ee7b7',
              fontSize: 14,
              letterSpacing: '0.1em',
              fontFamily: 'Space Grotesk',
            }}
          >
            raioxdogoverno.com.br
          </span>
          <span
            style={{
              color: '#facc15',
              fontSize: 14,
              fontWeight: 900,
              textTransform: 'uppercase',
              fontFamily: 'Epilogue',
            }}
          >
            DADOS DO PORTAL DA TRANSPARENCIA
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Epilogue',
          data: fonts.epilogue,
          style: 'normal' as const,
          weight: 900 as const,
        },
        {
          name: 'Space Grotesk',
          data: fonts.spaceGrotesk,
          style: 'normal' as const,
          weight: 500 as const,
        },
      ],
    },
  )
}
