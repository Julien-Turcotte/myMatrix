import { useEffect, useRef } from 'react';
import { getUserColor, formatTimestamp } from '../utils/colors';

function MessageLine({ msg, currentUserId }) {
  const isOwn = msg.sender === currentUserId;
  const senderColor = getUserColor(msg.sender);
  const displaySender = msg.sender ? msg.sender.split(':')[0].replace('@', '') : 'unknown';

  if (msg.type === 'm.room.member') {
    const membership = msg.content?.membership;
    const prevMembership = msg.content?.prev_membership;
    let action = '';
    if (membership === 'join') action = 'joined the room';
    else if (membership === 'leave') action = prevMembership === 'invite' ? 'rejected invite' : 'left the room';
    else if (membership === 'invite') action = `was invited`;
    else if (membership === 'ban') action = 'was banned';

    return (
      <div className="msg-system msg-fade-in">
        <span className="msg-ts dim">[{formatTimestamp(msg.timestamp)}]</span>
        <span className="msg-system-text">
          -- <span style={{ color: senderColor }}>{displaySender}</span> {action}
        </span>
      </div>
    );
  }

  if (msg.isDecryptionFailure) {
    return (
      <div className="msg-line msg-fade-in">
        <span className="msg-ts dim">[{formatTimestamp(msg.timestamp)}]</span>
        <span className="msg-sender" style={{ color: senderColor }}>{displaySender}</span>
        <span className="msg-sep">: </span>
        <span className="msg-decryption-error">[unable to decrypt]</span>
      </div>
    );
  }

  const msgType = msg.content?.msgtype;
  if (msgType === 'm.emote') {
    return (
      <div className="msg-line msg-emote msg-fade-in">
        <span className="msg-ts dim">[{formatTimestamp(msg.timestamp)}]</span>
        <span className="msg-emote-text">
          * <span style={{ color: senderColor }}>{displaySender}</span> {msg.content?.body}
        </span>
      </div>
    );
  }

  if (msgType === 'm.image') {
    return (
      <div className="msg-line msg-fade-in">
        <span className="msg-ts dim">[{formatTimestamp(msg.timestamp)}]</span>
        <span className={`msg-sender ${isOwn ? 'msg-own' : ''}`} style={{ color: isOwn ? '#1793D1' : senderColor }}>
          {displaySender}
        </span>
        <span className="msg-sep">: </span>
        <span className="msg-image-placeholder">[image: {msg.content?.body}]</span>
      </div>
    );
  }

  const body = msg.content?.body || '';
  // Handle reply formatting
  const isReply = msg.content?.['m.relates_to']?.['m.in_reply_to'];
  const displayBody = isReply ? body.replace(/^>.*\n\n/s, '') : body;

  return (
    <div className={`msg-line ${isOwn ? 'msg-own-line' : ''} msg-fade-in`}>
      <span className="msg-ts dim">[{formatTimestamp(msg.timestamp)}]</span>
      <span className={`msg-sender`} style={{ color: isOwn ? '#1793D1' : senderColor }}>
        {displaySender}
      </span>
      <span className="msg-sep">: </span>
      <span className="msg-body">{displayBody}</span>
    </div>
  );
}

export default function ChatPanel({ room, messages, typingUsers, currentUserId, isEncrypted }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!room) {
    return (
      <div className="chat-panel chat-empty">
        <div className="chat-empty-text">
          <div>// no room selected</div>
          <div className="dim">use Ctrl+K to open room switcher</div>
          <div className="dim">or click a room in the sidebar</div>
        </div>
      </div>
    );
  }

  const roomMessages = messages[room.roomId] || [];
  const typingList = Object.keys(typingUsers[room.roomId] || {})
    .filter(uid => uid !== currentUserId)
    .map(uid => uid.split(':')[0].replace('@', ''));

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span className="chat-header-prefix">#</span>
        <span className="chat-header-name">{room.name || room.roomId}</span>
        {isEncrypted && <span className="chat-e2e-badge" title="End-to-end encrypted">🔒</span>}
        <span className="chat-header-id dim">{room.roomId}</span>
      </div>

      <div className="chat-messages" ref={containerRef}>
        {roomMessages.length === 0 && (
          <div className="chat-no-messages dim">-- no messages in timeline --</div>
        )}
        {roomMessages.map(msg => (
          <MessageLine key={msg.id} msg={msg} currentUserId={currentUserId} />
        ))}
        {typingList.length > 0 && (
          <div className="typing-indicator dim">
            <span className="typing-dots">...</span>
            {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
