import satori from 'satori';
import fs from 'fs';
import path from 'path';
import data from '../../../../telemetry.json';

export async function GET() {
  try {
    const fontMediumPath = path.join(process.cwd(), 'src/assets/HackNerdFontMono-Regular.ttf');
    const fontBoldPath = path.join(process.cwd(), 'src/assets/HackNerdFontMono-Bold.ttf');
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
          width: '244px', 
          border: '2px solid #7aa2f7',
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
              fontFamily: 'Hack',
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
              fontFamily: 'Hack',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {isCurrent ? `[STATUS: PLAYING]  [${game.time.toUpperCase()}]` : `RATING: ${game.rating}  [${game.time.toUpperCase()}]`}
          </div>
        </div>
      </div>
    );

    const CommandPrompt = ({ command, showTime }: { command: string, showTime?: boolean }) => (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '24px', 
        width: '100%', 
        backgroundColor: '#16161e', 
        border: '2px solid #7aa2f7', 
        padding: '14px 18px',
        fontSize: '18px', // Slightly smaller to help fit
        lineHeight: 1.2,
      }}>
        <div style={{ display: 'flex', flexDirection: 'row', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#7aa2f7', fontWeight: 700, marginRight: '12px' }}>asitos@rasmalaai-pi:~$</span>
          <span style={{ color: '#ffffff', fontWeight: 700 }}>
            {command}
            <span style={{ color: '#fe9e64' }}>_</span>
          </span>
        </div>
        {showTime && (
          <div style={{ display: 'flex', color: '#7aa2f7', fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '12px' }}>
            {`[SYNC: ${new Date().toISOString().replace('T', ' ').substring(0, 16)}Z]`}
          </div>
        )}
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
          fontFamily: 'Hack',
        }}
      >
        {current && (
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
            <CommandPrompt command="./fetch_telemetry --status playing" showTime={true} />
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
        width: 960, // Increased to fit the long prompt + timestamp
        height: current ? 1620 : 1100,
        fonts: [
          {
            name: 'Hack',
            data: fontMedium,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Hack',
            data: fontBold,
            weight: 700,
            style: 'normal',
          }
        ],
      }
    );

    const finalSvg = svg.replace(
      '</svg>',
      `
        <defs>
          <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="2" fill="#000000" fill-opacity="0.0" />
            <rect y="2" width="4" height="2" fill="#000000" fill-opacity="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#scanlines)" pointer-events="none" />
        <style>
          @keyframes blink { 
            0%, 100% { opacity: 1; } 
            50% { opacity: 0; } 
          }
          path[fill="#fe9e64"] { 
            animation: blink 1s step-end infinite; 
          }
        </style>
      </svg>
      `
    );

    return new Response(finalSvg, {
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
