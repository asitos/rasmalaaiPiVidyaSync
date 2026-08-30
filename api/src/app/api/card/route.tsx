import satori from 'satori';
import fs from 'fs';
import path from 'path';
import games from '../../../../telemetry.json';

// We disable static generation because we want it to fetch the LATEST bundled telemetry if deployed.
// Actually, if we use import, the data is baked in at build time. 
// A static route is fine, it will serve the SVG built at deployment time!

export async function GET() {
  try {
    // Read the font
    const fontPath = path.join(process.cwd(), 'src/assets/Roboto-Regular.ttf');
    const fontData = fs.readFileSync(fontPath);

    const svg = await satori(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1a1b26',
          padding: '48px',
          paddingTop: '20px',
          paddingBottom: '20px',
          border: '2px solid #24283b',
          borderRadius: '16px',
          fontFamily: 'Roboto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', color: '#9aa5ce', fontSize: '24px', marginBottom: '30px', paddingBottom: '20px' }}>
          {'recently played vidya'}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', width: '100%' }}>
          {games.slice(0, 4).map((game: any, index: number) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', width: '210px' }}>
              <img
                src={game.cover_url}
                width={210}
                height={290}
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
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  width: '100%',
                  color: '#c0caf5', 
                  fontSize: '18px', 
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
                {`rating: ${game.rating} • ${game.time}`}
              </div>
            </div>
          ))}
        </div>
      </div>,
      {
        width: 1000,
        height: 480,
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
        // Max-age 60s avoids the stale-while-revalidate first-load bug,
        // and ensures the profile updates quickly after Vercel deployment.
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response('telemetry pipeline failure', { status: 500 });
  }
}
