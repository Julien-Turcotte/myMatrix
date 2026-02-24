import { useState, useEffect, useRef, useCallback } from 'react';

export default function RoomSwitcher({ rooms, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const filtered = rooms.filter(room => {
    const name = (room.name || room.roomId).toLowerCase();
    const id = room.roomId.toLowerCase();
    const q = query.toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  function handleSelect(roomId) {
    onSelect(roomId);
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && filtered.length > 0) {
      handleSelect(filtered[0].roomId);
    }
  }

  return (
    <div className="switcher-overlay" onClick={onClose}>
      <div className="switcher-box" onClick={e => e.stopPropagation()}>
        <div className="switcher-header">
          <span className="switcher-title">// room switcher</span>
          <span className="switcher-hint dim">Esc to close</span>
        </div>
        <div className="switcher-input-row">
          <span className="switcher-prompt">&gt;</span>
          <input
            ref={inputRef}
            className="switcher-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="fuzzy search rooms..."
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        <div className="switcher-results">
          {filtered.length === 0 && (
            <div className="switcher-empty dim">no rooms match</div>
          )}
          {filtered.map((room, idx) => (
            <button
              key={room.roomId}
              className={`switcher-item ${idx === 0 && query ? 'switcher-item-first' : ''}`}
              onClick={() => handleSelect(room.roomId)}
            >
              <span className="switcher-item-prefix">#</span>
              <span className="switcher-item-name">{room.name || room.roomId}</span>
              <span className="switcher-item-id dim">{room.roomId}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
