import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const url = 'https://raw.githubusercontent.com/asitos/rasmalaaiPiVidyaSync/main/telemetry.json';
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
            padding: '40px',
            border: '2px solid #24283b',
            borderRadius: '12px',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ display: 'flex', color: '#9ece6a', fontSize: '24px', marginBottom: '30px' }}>
            👾 telemetry: recent digital archives
          </div>
          
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
                    display: 'flex', // <-- SATORI FIX: strict layout declaration
                    color: '#c0caf5', 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden' 
                  }}
                >
                  {game.title}
                </div>
                <div 
                  style={{ 
                    display: 'flex', // <-- SATORI FIX: strict layout declaration
                    color: '#7aa2f7', 
                    fontSize: '14px', 
                    marginTop: '6px' 
                  }}
                >
                  rating: {game.rating} • {game.time}
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
