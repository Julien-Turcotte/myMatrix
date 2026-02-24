import { useState, useEffect, useRef } from 'react';

export default function RoomSwitcher({ rooms, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

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
    const name = (room.name || '').toLowerCase();
    // Only match on the localpart of the room ID (before the ':'), not the server part
    const idLocalpart = room.roomId.split(':')[0].toLowerCase();
    const q = query.toLowerCase();
    return name.includes(q) || idLocalpart.includes(q);
  });

  // Clamp selectedIdx to valid range
  const activeIdx = filtered.length > 0 ? Math.min(selectedIdx, filtered.length - 1) : 0;

  // Scroll active item into view when it changes
  useEffect(() => {
    itemRefs.current[activeIdx]?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  function handleQueryChange(e) {
    setQuery(e.target.value);
    setSelectedIdx(0);
  }

  function handleSelect(roomId) {
    onSelect(roomId);
    onClose();
  }

  function handleKeyDown(e) {
    if (filtered.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setSelectedIdx(i => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setSelectedIdx(i => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      handleSelect(filtered[activeIdx].roomId);
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
            onChange={handleQueryChange}
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
              ref={el => { itemRefs.current[idx] = el; }}
              className={`switcher-item ${idx === activeIdx ? 'switcher-item-active' : ''}`}
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
