import satori from 'satori';
import fs from 'fs';
import path from 'path';
import data from '../../../../telemetry.json';

export async function GET() {
  try {
    const fontMediumPath = path.join(process.cwd(), 'src/assets/TerminessNerdFontMono-Regular.ttf');
    const fontBoldPath = path.join(process.cwd(), 'src/assets/TerminessNerdFontMono-Bold.ttf');
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
          width: '244px', // 240px image + 2px left border + 2px right border
          border: '2px solid #7aa2f7',
          backgroundColor: '#16161e',
        }}
      >
        <img
          src={game.cover_url}
          width={240}
          height={320}
          style={{
            width: '240px', // Exact image width
            height: '320px',
            objectFit: 'cover',
            borderBottom: '2px solid #7aa2f7',
          }}
        />
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            padding: '16px',
            width: '100%',
          }}
        >
          <div 
            style={{ 
              display: 'flex',
              color: isCurrent ? '#ff9e64' : '#ffffff', 
              fontSize: '18px', 
              fontFamily: 'Terminess',
              fontWeight: 700,
              textTransform: 'uppercase',
              lineHeight: 1.2,
              marginBottom: '10px',
            }}
          >
            {`> ${game.title}`}
          </div>
          <div 
            style={{ 
              display: 'flex', 
              color: '#e7ddff', 
              fontSize: '16px', 
              fontFamily: 'Terminess',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {isCurrent ? `[STATUS: PLAYING]  [${game.time.toUpperCase()}]` : `RATING: ${game.rating}  [${game.time.toUpperCase()}]`}
          </div>
        </div>
      </div>
    );

    const CommandPrompt = ({ command }: { command: string }) => (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: '24px', 
        width: '100%', 
        backgroundColor: '#16161e', 
        border: '2px solid #7aa2f7', 
        padding: '14px 18px',
        fontSize: '20px',
        lineHeight: 1.2,
      }}>
        <span style={{ color: '#7aa2f7', fontWeight: 700, marginRight: '12px' }}>asitos@rasmalaai-pi:~$</span>
        <span style={{ color: '#ffffff', fontWeight: 700 }}>{command}</span>
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
          padding: '48px',
          fontFamily: 'Terminess',
        }}
      >
        {current && (
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
            <CommandPrompt command="./fetch_telemetry --status playing" />
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
              <GameCard game={current} isCurrent={true} />
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <CommandPrompt command="cat /var/log/vidya/recent.log" />
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', width: '100%' }}>
            {games.slice(0, 6).map((game: any, index: number) => (
              <GameCard key={index} game={game} />
            ))}
          </div>
        </div>
      </div>,
      {
        width: 876,
        height: current ? 1531 : 1018,
        fonts: [
          {
            name: 'Terminess',
            data: fontMedium,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Terminess',
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
