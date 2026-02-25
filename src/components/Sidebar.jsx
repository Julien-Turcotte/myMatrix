import { useState, useRef, useEffect } from 'react';
import { getUserColor } from '../utils/colors';

const MAX_ROOM_NAME_LENGTH = 22;

export default function Sidebar({ rooms, activeRoomId, onSelectRoom, onLeaveRoom, onLogout, syncState, getUnreadCount, userId, onNewConversation }) {
  const [pendingLeaveRoomId, setPendingLeaveRoomId] = useState(null);
  const [confirmInput, setConfirmInput] = useState('');
  const confirmRef = useRef(null);

  useEffect(() => {
    if (pendingLeaveRoomId) {
      confirmRef.current?.focus();
    }
  }, [pendingLeaveRoomId]);

  function getRoomName(room) {
    return room.name || room.roomId;
  }

  function getRoomPrefix(room) {
    // Use # for public/generic rooms, @ for DMs
    const isDirect = room.getDMInviter?.() || false;
    return isDirect ? '@' : '#';
  }

  function getDisplayName(room) {
    const name = getRoomName(room);
    // Trim long names
    return name.length > MAX_ROOM_NAME_LENGTH ? name.slice(0, MAX_ROOM_NAME_LENGTH - 1) + '…' : name;
  }

  const syncIndicator = {
    'PREPARED': { symbol: '●', cls: 'sync-ok' },
    'SYNCING': { symbol: '●', cls: 'sync-ok' },
    'ERROR': { symbol: '●', cls: 'sync-err' },
    'STOPPED': { symbol: '○', cls: 'sync-stopped' },
  }[syncState] || { symbol: '○', cls: 'sync-stopped' };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">myMatrix</span>
        <span className={`sidebar-sync ${syncIndicator.cls}`} title={syncState}>
          {syncIndicator.symbol}
        </span>
      </div>

      {userId && (
        <div className="sidebar-user">
          <span className="sidebar-user-prefix">$</span>
          <span className="sidebar-user-id" style={{ color: getUserColor(userId) }}>
            {userId.split(':')[0].replace('@', '')}
          </span>
        </div>
      )}

      <div className="sidebar-section-label">
        <span>// rooms</span>
        <button
          type="button"
          className="sidebar-new-btn"
          onClick={onNewConversation}
          title="New conversation"
          aria-label="New conversation"
        >+</button>
      </div>

      <nav className="sidebar-rooms">
        {rooms.length === 0 && (
          <div className="sidebar-empty">no rooms joined</div>
        )}
        {rooms.map((room, idx) => {
          const unread = getUnreadCount(room);
          const isActive = room.roomId === activeRoomId;
          return (
            <div
              key={room.roomId}
              className={`sidebar-room ${isActive ? 'active' : ''}`}
              title={room.roomId}
            >
              <button
                type="button"
                className="sidebar-room-select"
                onClick={() => onSelectRoom(room.roomId)}
              >
                <span className="sidebar-room-prefix">{getRoomPrefix(room)}</span>
                <span className="sidebar-room-name">{getDisplayName(room)}</span>
                {unread > 0 && (
                  <span className="sidebar-badge">{unread > 99 ? '99+' : unread}</span>
                )}
                {idx < 9 && (
                  <span className="sidebar-shortcut">alt+{idx + 1}</span>
                )}
              </button>
              {onLeaveRoom && (
                pendingLeaveRoomId === room.roomId ? (
                  <span className="sidebar-room-confirm">
                    <span className="sidebar-room-confirm-label">leave? [Y/n]&nbsp;</span>
                    <input
                      ref={confirmRef}
                      className="sidebar-room-confirm-input"
                      type="text"
                      value={confirmInput}
                      maxLength={1}
                      onChange={e => setConfirmInput(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const val = confirmInput.trim().toLowerCase();
                          const confirmed = val === '' || val === 'y';
                          setPendingLeaveRoomId(null);
                          setConfirmInput('');
                          if (confirmed) {
                            try {
                              await onLeaveRoom(room.roomId);
                            } catch (err) {
                              console.error('Failed to leave room', err);
                            }
                          }
                        } else if (e.key === 'Escape') {
                          setPendingLeaveRoomId(null);
                          setConfirmInput('');
                        }
                      }}
                      onBlur={() => {
                        setPendingLeaveRoomId(null);
                        setConfirmInput('');
                      }}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </span>
                ) : (
                  <button
                    type="button"
                    className="sidebar-room-leave"
                    title="Leave room"
                    aria-label="Leave room"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingLeaveRoomId(room.roomId);
                      setConfirmInput('');
                    }}
                  >×</button>
                )
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={onLogout}>
          [logout]
        </button>
      </div>
    </aside>
  );
}
