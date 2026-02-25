import { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import MessageInput from './MessageInput';
import RoomSwitcher from './RoomSwitcher';
import NewConversationDialog from './NewConversationDialog';

function LeaveRoomDialog({ room, onConfirm, onCancel }) {
  const [confirmInput, setConfirmInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      const val = confirmInput.trim().toLowerCase();
      if (val === '' || val === 'y') onConfirm();
      else onCancel();
    }
  }

  const roomName = room.name || room.roomId;

  return (
    <div className="switcher-overlay" onClick={onCancel}>
      <div className="switcher-box" onClick={e => e.stopPropagation()}>
        <div className="switcher-header">
          <span className="switcher-title">// leave room?</span>
          <span className="switcher-hint dim">Esc to cancel</span>
        </div>
        <div className="switcher-input-row">
          <span className="sidebar-room-confirm-label">Leave {roomName}? [Y/n]&nbsp;</span>
          <input
            ref={inputRef}
            className="sidebar-room-confirm-input"
            type="text"
            value={confirmInput}
            maxLength={1}
            onChange={e => setConfirmInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}

export default function MainLayout({
  client,
  rooms,
  activeRoomId,
  messages,
  typingUsers,
  syncState,
  onSelectRoom,
  onSendMessage,
  onJoinRoom,
  onLeaveRoom,
  onLogout,
  sendTyping,
  getUnreadCount,
  onCreateRoom,
}) {
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const userId = client?.getUserId?.() || '';
  const activeRoom = rooms.find(r => r.roomId === activeRoomId) || null;
  const isEncrypted = activeRoomId ? (client?.isRoomEncrypted?.(activeRoomId) ?? false) : false;

  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement?.tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;

      // Ctrl+K → room switcher
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowSwitcher(prev => !prev);
      }
      // Alt+1..9 → switch rooms
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (rooms[idx]) {
          onSelectRoom(rooms[idx].roomId);
        }
      }
      // c → new conversation (when not typing)
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key === 'c' && !isEditing) {
        e.preventDefault();
        setShowNewConversation(true);
      }
      // d → leave active room (when not typing)
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key === 'd' && !isEditing && activeRoomId) {
        e.preventDefault();
        setShowLeaveConfirm(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rooms, onSelectRoom, activeRoomId]);

  async function handleSend(text) {
    if (!activeRoomId) return;
    if (text.startsWith('/me ')) {
      const emoteText = text.slice(4);
      try {
        await client.sendEmoteMessage(activeRoomId, emoteText);
      } catch (err) {
        console.error('Send emote error:', err);
      }
    } else {
      try {
        await onSendMessage(activeRoomId, text);
      } catch (err) {
        console.error('Send error:', err);
      }
    }
  }

  async function handleCreateRoom(opts) {
    let roomId;
    try {
      roomId = await onCreateRoom(opts);
    } catch (err) {
      console.error('Error creating room:', err);
      throw err;
    }

    if (!roomId) return;

    try {
      onSelectRoom(roomId);
    } catch (err) {
      console.error('Error selecting newly created room:', err);
      throw err;
    }
  }

  return (
    <div className="main-layout">
      <Sidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={onSelectRoom}
        onLeaveRoom={onLeaveRoom}
        onLogout={onLogout}
        syncState={syncState}
        getUnreadCount={getUnreadCount}
        userId={userId}
        onNewConversation={() => setShowNewConversation(true)}
      />

      <div className="main-content">
        <ChatPanel
          room={activeRoom}
          messages={messages}
          typingUsers={typingUsers}
          currentUserId={userId}
          isEncrypted={isEncrypted}
        />

        <MessageInput
          onSend={handleSend}
          onJoin={onJoinRoom}
          onLeave={onLeaveRoom}
          onTyping={sendTyping}
          roomId={activeRoomId}
          userId={userId}
          disabled={!activeRoomId}
        />
      </div>

      {showSwitcher && (
        <RoomSwitcher
          rooms={rooms}
          onSelect={onSelectRoom}
          onClose={() => setShowSwitcher(false)}
        />
      )}

      {showNewConversation && (
        <NewConversationDialog
          onClose={() => setShowNewConversation(false)}
          onCreate={handleCreateRoom}
        />
      )}

      {showLeaveConfirm && activeRoom && (
        <LeaveRoomDialog
          room={activeRoom}
          onConfirm={async () => {
            setShowLeaveConfirm(false);
            try {
              await onLeaveRoom(activeRoomId);
            } catch (err) {
              console.error('Failed to leave room:', err);
            }
          }}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
    </div>
  );
}
