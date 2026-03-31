import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') ?? 'AlgoVigilance';
  const description =
    searchParams.get('description') ?? 'Empowerment Through Vigilance';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          background:
            'linear-gradient(135deg, #060610 0%, #0a0a1a 50%, #0d0d20 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top bar accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #00CED1 0%, #D4AF37 100%)',
          }}
        />

        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(0, 206, 209, 0.15)',
              border: '1px solid rgba(0, 206, 209, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00CED1',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            N
          </div>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
            }}
          >
            AlgoVigilance
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.15,
            marginBottom: '20px',
            maxWidth: '900px',
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: 1.4,
            maxWidth: '800px',
          }}
        >
          {description}
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '80px',
            fontSize: '16px',
            color: '#D4AF37',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
          }}
        >
          Empowerment Through Vigilance
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
