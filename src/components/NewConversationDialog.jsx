import { useState, useEffect, useRef } from 'react';

export default function NewConversationDialog({ onClose, onCreate }) {
  const [mode, setMode] = useState('room'); // 'room' | 'dm'
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    if (mode === 'dm' && !/^@[^:]+:.+$/.test(trimmed)) {
      setError('User ID must be in format @user:server.com');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onCreate({
        isDirect: mode === 'dm',
        name: mode === 'room' ? trimmed : undefined,
        inviteUserId: mode === 'dm' ? trimmed : undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="switcher-overlay" onClick={onClose}>
      <div className="switcher-box" onClick={e => e.stopPropagation()}>
        <div className="switcher-header">
          <span className="switcher-title">// new conversation</span>
          <span className="switcher-hint dim">Esc to close</span>
        </div>

        <div className="new-conv-tabs">
          <button
            className={`new-conv-tab ${mode === 'room' ? 'active' : ''}`}
            onClick={() => { setMode('room'); setValue(''); setError(''); }}
          >
            # room
          </button>
          <button
            className={`new-conv-tab ${mode === 'dm' ? 'active' : ''}`}
            onClick={() => { setMode('dm'); setValue(''); setError(''); }}
          >
            @ direct message
          </button>
        </div>

        <form className="new-conv-form" onSubmit={handleSubmit}>
          <div className="switcher-input-row">
            <span className="switcher-prompt">{mode === 'room' ? '#' : '@'}</span>
            <input
              ref={inputRef}
              className="switcher-input"
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value); setError(''); }}
              placeholder={mode === 'room' ? 'room name…' : 'user id, e.g. @user:server.com'}
              autoComplete="off"
              spellCheck="false"
              disabled={loading}
            />
          </div>
          {error && <div className="new-conv-error">{error}</div>}
          <div className="new-conv-actions">
            <button
              type="submit"
              className="new-conv-submit"
              disabled={loading || !value.trim()}
            >
              {loading ? 'creating…' : '[create]'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
