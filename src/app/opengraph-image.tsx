import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Series Recommender'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Icon */}
        <div
          style={{
            fontSize: '72px',
            marginBottom: '24px',
          }}
        >
          🎬
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-2px',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '20px',
          }}
        >
          Series Recommender
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '26px',
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.5,
            marginBottom: '48px',
          }}
        >
          Descubra séries e filmes personalizados com base no que você já assistiu
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {['📺 5 Séries', '🎞️ 5 Filmes', '🌐 Streaming no Brasil'].map((label) => (
            <div
              key={label}
              style={{
                background: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '999px',
                padding: '10px 22px',
                fontSize: '18px',
                color: '#d4d4d8',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
