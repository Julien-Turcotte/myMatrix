import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import MessageInput from './MessageInput';
import RoomSwitcher from './RoomSwitcher';
import NewConversationDialog from './NewConversationDialog';

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
  const userId = client?.getUserId?.() || '';
  const activeRoom = rooms.find(r => r.roomId === activeRoomId) || null;

  useEffect(() => {
    function handleKeyDown(e) {
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
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rooms, onSelectRoom]);

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
    const roomId = await onCreateRoom(opts);
    if (roomId) onSelectRoom(roomId);
  }

  return (
    <div className="main-layout">
      <Sidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={onSelectRoom}
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
    </div>
  );
}
