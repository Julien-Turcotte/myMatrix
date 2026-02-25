import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginScreen from '../components/LoginScreen';

describe('LoginScreen', () => {
  it('renders the login box with title', () => {
    render(<LoginScreen onLogin={vi.fn()} />);
    expect(screen.getByText('myMatrix')).toBeInTheDocument();
    expect(screen.getByText('// terminal matrix client')).toBeInTheDocument();
  });

  it('renders homeserver URL and user ID fields', () => {
    render(<LoginScreen onLogin={vi.fn()} />);
    expect(screen.getByPlaceholderText('https://matrix.org')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('@user:matrix.org')).toBeInTheDocument();
  });

  it('defaults to password mode and shows password field', () => {
    render(<LoginScreen onLogin={vi.fn()} />);
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('syt_...')).not.toBeInTheDocument();
  });

  it('switches to token mode on tab click', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);
    await user.click(screen.getByText('[access_token]'));
    expect(screen.getByPlaceholderText('syt_...')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('••••••••')).not.toBeInTheDocument();
  });

  it('shows device_id field in token mode', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);
    await user.click(screen.getByText('[access_token]'));
    expect(screen.getByPlaceholderText('ABCDEFGH (optional)')).toBeInTheDocument();
  });

  it('shows error when homeserver URL is missing', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);
    const urlInput = screen.getByPlaceholderText('https://matrix.org');
    await user.clear(urlInput);
    await user.click(screen.getByText('[ connect ]'));
    expect(screen.getByText('Homeserver URL required')).toBeInTheDocument();
  });

  it('shows error when user ID is missing', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);
    await user.click(screen.getByText('[ connect ]'));
    expect(screen.getByText('User ID required')).toBeInTheDocument();
  });

  it('shows error when password is missing in password mode', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('@user:matrix.org'), '@alice:matrix.org');
    await user.click(screen.getByText('[ connect ]'));
    expect(screen.getByText('Password required')).toBeInTheDocument();
  });

  it('shows error when access token is missing in token mode', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);
    await user.click(screen.getByText('[access_token]'));
    await user.type(screen.getByPlaceholderText('@user:matrix.org'), '@alice:matrix.org');
    await user.click(screen.getByText('[ connect ]'));
    expect(screen.getByText('Access token required')).toBeInTheDocument();
  });

  it('calls onLogin with password credentials', async () => {
    const onLogin = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<LoginScreen onLogin={onLogin} />);
    await user.type(screen.getByPlaceholderText('@user:matrix.org'), '@alice:matrix.org');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret123');
    await user.click(screen.getByText('[ connect ]'));
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({
      baseUrl: 'https://matrix.org',
      userId: '@alice:matrix.org',
      password: 'secret123',
      accessToken: undefined,
      deviceId: undefined,
    }));
  });

  it('calls onLogin with token credentials', async () => {
    const onLogin = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<LoginScreen onLogin={onLogin} />);
    await user.click(screen.getByText('[access_token]'));
    await user.type(screen.getByPlaceholderText('@user:matrix.org'), '@alice:matrix.org');
    await user.type(screen.getByPlaceholderText('syt_...'), 'syt_mytoken');
    await user.click(screen.getByText('[ connect ]'));
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({
      baseUrl: 'https://matrix.org',
      userId: '@alice:matrix.org',
      password: undefined,
      accessToken: 'syt_mytoken',
      deviceId: undefined,
    }));
  });

  it('passes deviceId when filled in token mode', async () => {
    const onLogin = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<LoginScreen onLogin={onLogin} />);
    await user.click(screen.getByText('[access_token]'));
    await user.type(screen.getByPlaceholderText('@user:matrix.org'), '@alice:matrix.org');
    await user.type(screen.getByPlaceholderText('syt_...'), 'syt_mytoken');
    await user.type(screen.getByPlaceholderText('ABCDEFGH (optional)'), 'MYDEVICE');
    await user.click(screen.getByText('[ connect ]'));
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({
      baseUrl: 'https://matrix.org',
      userId: '@alice:matrix.org',
      password: undefined,
      accessToken: 'syt_mytoken',
      deviceId: 'MYDEVICE',
    }));
  });

  it('shows error prop from parent', () => {
    render(<LoginScreen onLogin={vi.fn()} error="Invalid credentials" />);
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.getByText('ERR!')).toBeInTheDocument();
  });

  it('shows error returned by onLogin', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Bad password'));
    const user = userEvent.setup();
    render(<LoginScreen onLogin={onLogin} />);
    await user.type(screen.getByPlaceholderText('@user:matrix.org'), '@alice:matrix.org');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await user.click(screen.getByText('[ connect ]'));
    await waitFor(() => expect(screen.getByText('Bad password')).toBeInTheDocument());
  });

  it('shows "connecting..." while loading', async () => {
    let resolveLogin;
    const onLogin = vi.fn().mockReturnValue(new Promise(r => { resolveLogin = r; }));
    const user = userEvent.setup();
    render(<LoginScreen onLogin={onLogin} />);
    await user.type(screen.getByPlaceholderText('@user:matrix.org'), '@alice:matrix.org');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('[ connect ]'));
    await waitFor(() => expect(screen.getByText('[ connecting... ]')).toBeInTheDocument());
    resolveLogin();
  });

  it('switches back to password mode from token mode', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);
    await user.click(screen.getByText('[access_token]'));
    await user.click(screen.getByText('[password]'));
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });
});
