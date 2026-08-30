import satori from 'satori';
import fs from 'fs';
import path from 'path';
import data from '../../../../telemetry.json';

export async function GET() {
  try {
    const fontPath = path.join(process.cwd(), 'src/assets/Roboto-Regular.ttf');
    const fontData = fs.readFileSync(fontPath);

    // Fallback for transition between array and object schemas
    const games = Array.isArray(data) ? data : (data.games || []);
    const current = Array.isArray(data) ? null : data.current;

    const GameCard = ({ game, isCurrent }: { game: any, isCurrent?: boolean }) => (
      <div style={{ display: 'flex', flexDirection: 'column', width: '220px', alignItems: 'center' }}>
        <img
          src={game.cover_url}
          width={220}
          height={300}
          style={{
            width: '220px',
            height: '300px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '12px',
            border: '2px solid #414868',
          }}
        />
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
            color: '#c0caf5', 
            fontSize: isCurrent ? '20px' : '18px', 
            fontWeight: 'bold',
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
          {isCurrent ? `currently playing • ${game.time}` : `rating: ${game.rating} • ${game.time}`}
        </div>
      </div>
    );

    const svg = await satori(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#1a1b26',
          padding: '48px',
          border: '2px solid #24283b',
          borderRadius: '16px',
          fontFamily: 'Roboto',
        }}
      >
        {current && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: '#ff9e64', fontSize: '24px', marginBottom: '24px' }}>
              {'currently playing'}
            </div>
            <GameCard game={current} isCurrent={true} />
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'center', color: '#9aa5ce', fontSize: '24px', marginBottom: '30px' }}>
          {'recently played vidya'}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', width: '100%' }}>
          {games.slice(0, 6).map((game: any, index: number) => (
            <GameCard key={index} game={game} />
          ))}
        </div>
      </div>,
      {
        width: 830,
        height: current ? 1340 : 920,
        fonts: [
          {
            name: 'Roboto',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    );

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response('telemetry pipeline failure', { status: 500 });
  }
}
