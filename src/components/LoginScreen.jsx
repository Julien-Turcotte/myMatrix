import { useState } from 'react';

export default function LoginScreen({ onLogin, error }) {
  const [mode, setMode] = useState('password'); // 'password' | 'token'
  const [baseUrl, setBaseUrl] = useState('https://matrix.org');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');
    if (!baseUrl) { setLocalError('Homeserver URL required'); return; }
    if (!userId) { setLocalError('User ID required'); return; }
    if (mode === 'password' && !password) { setLocalError('Password required'); return; }
    if (mode === 'token' && !accessToken) { setLocalError('Access token required'); return; }

    setLoading(true);
    try {
      await onLogin({
        baseUrl,
        userId,
        password: mode === 'password' ? password : undefined,
        accessToken: mode === 'token' ? accessToken : undefined,
        deviceId: deviceId || undefined,
      });
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const displayError = localError || error;

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-header">
          <span className="login-title">myMatrix</span>
          <span className="login-subtitle">// terminal matrix client</span>
        </div>

        <div className="login-separator">{'─'.repeat(48)}</div>

        <div className="login-mode-toggle">
          <span className="login-comment"># auth method:</span>
          <button
            className={`login-tab ${mode === 'password' ? 'active' : ''}`}
            onClick={() => setMode('password')}
            type="button"
          >
            [password]
          </button>
          <button
            className={`login-tab ${mode === 'token' ? 'active' : ''}`}
            onClick={() => setMode('token')}
            type="button"
          >
            [access_token]
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">homeserver_url</label>
            <span className="login-eq"> = </span>
            <input
              className="login-input"
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://matrix.org"
              autoComplete="off"
            />
          </div>

          <div className="login-field">
            <label className="login-label">user_id</label>
            <span className="login-eq"> = </span>
            <input
              className="login-input"
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="@user:matrix.org"
              autoComplete="username"
            />
          </div>

          {mode === 'password' && (
            <div className="login-field">
              <label className="login-label">password</label>
              <span className="login-eq"> = </span>
              <input
                className="login-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          )}

          {mode === 'token' && (
            <>
              <div className="login-field">
                <label className="login-label">access_token</label>
                <span className="login-eq"> = </span>
                <input
                  className="login-input"
                  type="password"
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  placeholder="syt_..."
                  autoComplete="off"
                />
              </div>
              <div className="login-field">
                <label className="login-label">device_id</label>
                <span className="login-eq"> = </span>
                <input
                  className="login-input"
                  type="text"
                  value={deviceId}
                  onChange={e => setDeviceId(e.target.value)}
                  placeholder="ABCDEFGH (optional)"
                  autoComplete="off"
                />
              </div>
            </>
          )}

          <div className="login-separator">{'─'.repeat(48)}</div>

          {displayError && (
            <div className="login-error">
              <span className="login-error-prefix">ERR! </span>
              {displayError}
            </div>
          )}

          <div className="login-actions">
            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? '[ connecting... ]' : '[ connect ]'}
            </button>
            <span className="login-hint">or press Enter</span>
          </div>
        </form>

        <div className="login-footer">
          <span className="login-comment"># Ctrl+K room switcher  |  Ctrl+Enter send  |  Esc clear</span>
        </div>
      </div>
    </div>
  );
}
