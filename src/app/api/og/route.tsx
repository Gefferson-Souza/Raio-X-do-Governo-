import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

async function loadFont(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  return response.arrayBuffer()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const valor = searchParams.get('valor') ?? 'R$ 1.500.000,00'
  const item = searchParams.get('item') ?? 'Gasto Público'
  const equivalencia = searchParams.get('equivalencia') ?? '6.000 consultas SUS'

  const [epilogueBold, spaceGroteskMedium] = await Promise.all([
    loadFont(
      'https://fonts.gstatic.com/s/epilogue/v17/O4ZMFGj5hxF0EhjimlIhqAYaY7EBcUSREF6IHBbCp0WJQ2qdlCYBer8F3vwEKHRIAx8v.woff2'
    ),
    loadFont(
      'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2'
    ),
  ])

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
            PORTAL DA TRANSPARÊNCIA
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
            A VERDADE QUE NÃO TE CONTAM
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
          data: epilogueBold,
          style: 'normal',
          weight: 900,
        },
        {
          name: 'Space Grotesk',
          data: spaceGroteskMedium,
          style: 'normal',
          weight: 500,
        },
      ],
    },
  )
}
