import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const url = 'https://raw.githubusercontent.com/asitos/rasmalaaiPiVidyaSync/feat/edge-svg-renderer/telemetry.json';
    const response = await fetch(url, { next: { revalidate: 0 } });
    
    if (!response.ok) {
      throw new Error('failed to fetch telemetry payload');
    }
    
    const games = await response.json();

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1a1b26',
            padding: '48px',
            paddingTop: '20px',
            border: '2px solid #24283b',
            borderRadius: '16px',
            fontFamily: 'monospace',
          }}
        >
          {/* forcing single strings bypasses the multi-child satori panic */}
          <div style={{ display: 'flex', justifyContent: 'center', color: '#9aa5ce', fontSize: '24px', marginBottom: '30px', paddingBottom: '20px' }}>
            {'recently played vidya'}
          </div>
          <br />
          
          <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', width: '100%' }}>
            {games.slice(0, 4).map((game: any, index: number) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', width: '210px' }}>
                <img
                  src={game.cover_url}
                  style={{
                    width: '210px',
                    height: '290px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '2px solid #414868',
                  }}
                />
                <div 
                  style={{ 
                    display: '-webkit-box', 
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%',
                    color: '#c0caf5', 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    textOverflow: 'ellipsis', 
                    // whiteSpace: 'nowrap', 
                    overflow: 'hidden' 
                  }}
                >
                  {`${game.title}`}
                </div>
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%',
                    color: '#7aa2f7', 
                    fontSize: '14px', 
                    marginTop: '6px' 
                  }}
                >
                  {/* fix: wrapped inside a single template string */}
                  {`rating: ${game.rating} • ${game.time}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: 1000,
        height: 480,
      }
    );
  } catch (error) {
    return new Response('telemetry pipeline failure', { status: 500 });
  }
}
