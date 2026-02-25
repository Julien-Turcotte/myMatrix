const LOGO_LINES = [
  '  ╔══╗      ╔══╗  ',
  '  ║  ╚══╦══╝  ║  ',
  '  ║   ╔═╩═╗   ║  ',
  '  ║   ║   ║   ║  ',
  '  ╚═══╝   ╚═══╝  ',
];

const COLOR_BLOCKS = [
  '#f38ba8',
  '#a6e3a1',
  '#f9e2af',
  '#89b4fa',
  '#cba6f7',
  '#1793D1',
];

export default function WelcomePanel({ currentUserId, rooms }) {
  const [username, server] = currentUserId
    ? currentUserId.replace('@', '').split(':')
    : ['guest', 'matrix'];
  const userLabel = `${username}@${server}`;
  const separator = '─'.repeat(userLabel.length);

  const infoLines = [
    { value: userLabel, bold: true, color: '#cdd6f4' },
    { value: separator, color: '#585b70' },
    { label: 'Client', value: `myMatrix v${__APP_VERSION__}` },
    { label: 'Protocol', value: 'Matrix' },
    { label: 'Rooms', value: String(rooms.length) },
    { value: separator, color: '#585b70' },
    { value: 'Ctrl+K  open room switcher', color: '#585b70' },
    { value: 'Alt+1-9  quick switch', color: '#585b70' },
  ];

  return (
    <div className="welcome-panel">
      <div className="welcome-neofetch">
        <div className="welcome-logo" aria-hidden="true">
          {LOGO_LINES.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className="welcome-info">
          {infoLines.map((line, i) => (
            <div key={i} className="welcome-info-line">
              {line.label && (
                <>
                  <span className="welcome-info-label">{line.label}</span>
                  <span className="welcome-info-sep">: </span>
                </>
              )}
              <span
                style={{
                  color: line.color,
                  fontWeight: line.bold ? 'bold' : undefined,
                }}
              >
                {line.value}
              </span>
            </div>
          ))}
          <div className="welcome-colors" aria-hidden="true">
            {COLOR_BLOCKS.map(color => (
              <span
                key={color}
                className="welcome-color-block"
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
