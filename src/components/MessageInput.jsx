import { useState, useRef, useEffect, useCallback } from 'react';

export default function MessageInput({ onSend, onJoin, onLeave, onTyping, roomId, userId, disabled }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [roomId]);

  const displayName = userId ? userId.split(':')[0].replace('@', '') : 'user';
  const host = userId ? userId.split(':')[1] : 'matrix';

  function handleChange(e) {
    setValue(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping?.(roomId, true);
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping?.(roomId, false);
    }, 2500);
  }

  const handleSend = useCallback(() => {
    const text = value.trim();
    if (!text) return;

    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    onTyping?.(roomId, false);

    // Handle slash commands
    if (text.startsWith('/join ')) {
      const target = text.slice(6).trim();
      onJoin?.(target);
    } else if (text === '/leave') {
      onLeave?.(roomId);
    } else if (text.startsWith('/me ')) {
      onSend?.(text); // pass raw for emote handling
    } else {
      onSend?.(text);
    }

    setValue('');
  }, [value, roomId, onSend, onJoin, onLeave, onTyping]);

  function handleKeyDown(e) {
    if ((e.ctrlKey && e.key === 'Enter') || e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      setValue('');
      isTypingRef.current = false;
      onTyping?.(roomId, false);
    }
  }

  return (
    <div className="input-container">
      <div className="input-prompt">
        <span className="prompt-user">{displayName}</span>
        <span className="prompt-at">@</span>
        <span className="prompt-host">{host}</span>
        <span className="prompt-sep"> ~ </span>
        <span className="prompt-arrow">&gt;</span>
      </div>
      <input
        ref={inputRef}
        className="message-input"
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'select a room...' : 'type a message... (/join /leave /me)'}
        disabled={disabled}
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  );
}
