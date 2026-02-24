import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

vi.mock('matrix-js-sdk', () => import('./test/__mocks__/matrix-js-sdk.js'));

import { mockClient, createClient } from './test/__mocks__/matrix-js-sdk.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.initRustCrypto.mockResolvedValue();
  mockClient.startClient.mockResolvedValue();
  mockClient.logout.mockResolvedValue();
  mockClient.getRooms.mockReturnValue([]);
  mockClient.getRoom.mockReturnValue(null);
  mockClient.on.mockImplementation(() => {});
  mockClient.off.mockImplementation(() => {});
  // loginWithPassword returns credentials for password-mode login
  mockClient.loginWithPassword.mockResolvedValue({
    user_id: '@alice:matrix.org',
    access_token: 'tok123',
    device_id: 'DEV1',
  });
  createClient.mockReturnValue(mockClient);
});

describe('App integration', () => {
  it('starts on the BOOT screen', () => {
    render(<App />);
    expect(document.querySelector('.boot-screen')).toBeInTheDocument();
    expect(document.querySelector('.login-screen')).not.toBeInTheDocument();
    expect(document.querySelector('.main-layout')).not.toBeInTheDocument();
  });

  it('transitions to LOGIN screen after boot completes', async () => {
    vi.useFakeTimers();
    render(<App />);
    expect(document.querySelector('.boot-screen')).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(4200); });
    expect(document.querySelector('.login-screen')).toBeInTheDocument();
    expect(document.querySelector('.boot-screen')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('transitions to MAIN screen after successful login', async () => {
    vi.useFakeTimers();
    render(<App />);
    await act(async () => { vi.advanceTimersByTime(4200); });
    vi.useRealTimers();

    await waitFor(() => expect(document.querySelector('.login-screen')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('@user:matrix.org'), '@alice:matrix.org');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password');
    await user.click(screen.getByText('[ connect ]'));

    await waitFor(() => expect(document.querySelector('.main-layout')).toBeInTheDocument());
  });

  it('shows login error when login fails', async () => {
    mockClient.startClient.mockRejectedValue(new Error('Unauthorized'));
    vi.useFakeTimers();
    render(<App />);
    await act(async () => { vi.advanceTimersByTime(4200); });
    vi.useRealTimers();

    await waitFor(() => expect(document.querySelector('.login-screen')).toBeInTheDocument());

    const user = userEvent.setup();
    // Use token mode to avoid loginWithPassword complexity
    await user.click(screen.getByText('[access_token]'));
    await user.type(screen.getByPlaceholderText('@user:matrix.org'), '@alice:matrix.org');
    await user.type(screen.getByPlaceholderText('syt_...'), 'syt_bad_token');
    await user.click(screen.getByText('[ connect ]'));

    await waitFor(() => expect(screen.getByText('Unauthorized')).toBeInTheDocument());
    expect(document.querySelector('.main-layout')).not.toBeInTheDocument();
  });

  it('transitions back to LOGIN on logout', async () => {
    vi.useFakeTimers();
    render(<App />);
    await act(async () => { vi.advanceTimersByTime(4200); });
    vi.useRealTimers();

    await waitFor(() => expect(document.querySelector('.login-screen')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('@user:matrix.org'), '@alice:matrix.org');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password');
    await user.click(screen.getByText('[ connect ]'));
    await waitFor(() => expect(document.querySelector('.main-layout')).toBeInTheDocument());

    await user.click(screen.getByText('[logout]'));
    await waitFor(() => expect(document.querySelector('.login-screen')).toBeInTheDocument());
    expect(document.querySelector('.main-layout')).not.toBeInTheDocument();
  });
});
