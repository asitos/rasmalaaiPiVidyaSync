import satori from 'satori';
import fs from 'fs';
import path from 'path';
import data from '../../../../telemetry.json';

export async function GET() {
  try {
    const fontMediumPath = path.join(process.cwd(), 'src/assets/JetBrainsMono-Medium.ttf');
    const fontBoldPath = path.join(process.cwd(), 'src/assets/JetBrainsMono-Bold.ttf');
    const fontMedium = fs.readFileSync(fontMediumPath);
    const fontBold = fs.readFileSync(fontBoldPath);

    // Fallback for transition between array and object schemas
    const games = Array.isArray(data) ? data : (data.games || []);
    const current = Array.isArray(data) ? null : data.current;

    const GameCard = ({ game, isCurrent }: { game: any, isCurrent?: boolean }) => (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          width: '240px', 
          border: '1px solid #414868',
          backgroundColor: '#16161e',
        }}
      >
        <img
          src={game.cover_url}
          width={240}
          height={320}
          style={{
            width: '240px',
            height: '320px',
            objectFit: 'cover',
            borderBottom: '1px solid #414868',
          }}
        />
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            padding: '12px',
            width: '100%',
          }}
        >
          <div 
            style={{ 
              display: 'flex',
              color: isCurrent ? '#ff9e64' : '#c0caf5', 
              fontSize: '14px', 
              fontFamily: 'JetBrains Mono',
              fontWeight: 700,
              textTransform: 'uppercase',
              lineHeight: 1.2,
              marginBottom: '8px',
            }}
          >
            {`> ${game.title}`}
          </div>
          <div 
            style={{ 
              display: 'flex', 
              color: '#7aa2f7', 
              fontSize: '12px', 
              fontFamily: 'JetBrains Mono',
              fontWeight: 400,
            }}
          >
            {isCurrent ? `[STATUS: PLAYING]  [${game.time.toUpperCase()}]` : `RATING: ${game.rating}  [${game.time.toUpperCase()}]`}
          </div>
        </div>
      </div>
    );

    const CommandPrompt = ({ command }: { command: string }) => (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '20px', width: '100%', backgroundColor: '#1a1b26', border: '1px solid #414868', padding: '10px' }}>
        <span style={{ color: '#9ece6a', fontWeight: 700, marginRight: '8px' }}>asitos@pi:~$</span>
        <span style={{ color: '#c0caf5', fontWeight: 400 }}>{command}</span>
      </div>
    );

    const svg = await satori(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1a1b26',
          padding: '40px',
          fontFamily: 'JetBrains Mono',
        }}
      >
        {current && (
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '40px' }}>
            <CommandPrompt command="./fetch_telemetry --status playing" />
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
              <GameCard game={current} isCurrent={true} />
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <CommandPrompt command="cat /var/log/vidya/recent.log" />
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', width: '100%' }}>
            {games.slice(0, 6).map((game: any, index: number) => (
              <GameCard key={index} game={game} />
            ))}
          </div>
        </div>
      </div>,
      {
        width: 840,
        height: current ? 1420 : 940,
        fonts: [
          {
            name: 'JetBrains Mono',
            data: fontMedium,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'JetBrains Mono',
            data: fontBold,
            weight: 700,
            style: 'normal',
          }
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
