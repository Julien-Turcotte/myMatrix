import { useState, useEffect } from 'react';

const BOOT_LINES = [
  { text: 'myMatrix v0.1.0 -- terminal client', delay: 0 },
  { text: '', delay: 200 },
  { text: 'Initializing Matrix Client...', delay: 400 },
  { text: 'Loading cryptographic modules...', delay: 700 },
  { text: 'Setting up event listeners...', delay: 1000 },
  { text: 'Connecting to homeserver...', delay: 1300 },
  { text: '', delay: 1700 },
  { text: '[  OK  ] Matrix SDK ready.', delay: 1900 },
  { text: '[  OK  ] Local storage initialized.', delay: 2100 },
  { text: '[  OK  ] Sync engine started.', delay: 2300 },
  { text: '', delay: 2600 },
  { text: 'Sync complete.', delay: 2800 },
  { text: '', delay: 3000 },
  { text: 'Welcome. Please authenticate.', delay: 3200 },
];

export default function BootScreen({ onDone }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = BOOT_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line.text]);
      }, line.delay)
    );

    const doneTimer = setTimeout(() => {
      setDone(true);
    }, 3800);

    const transTimer = setTimeout(() => {
      onDone();
    }, 4200);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
      clearTimeout(transTimer);
    };
  }, [onDone]);

  return (
    <div className="boot-screen">
      <div className="boot-content">
        {visibleLines.map((line, i) => (
          <div key={i} className={`boot-line ${line.startsWith('[  OK  ]') ? 'boot-ok' : line === 'Sync complete.' ? 'boot-sync' : ''}`}>
            {line || '\u00a0'}
          </div>
        ))}
        {!done && <span className="cursor-blink">█</span>}
        {done && (
          <div className="boot-line boot-prompt">
            Press any key or wait...
          </div>
        )}
      </div>
    </div>
  );
}
