import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainLayout from '../components/MainLayout';

function makeRoom(id, name = 'General') {
  return {
    roomId: id,
    name,
    getDMInviter: () => null,
  };
}

const baseProps = {
  client: { getUserId: () => '@alice:matrix.org', isRoomEncrypted: () => false, sendEmoteMessage: vi.fn() },
  rooms: [makeRoom('!r1:m.org', 'General'), makeRoom('!r2:m.org', 'Dev')],
  activeRoomId: null,
  messages: {},
  typingUsers: {},
  syncState: 'SYNCING',
  onSelectRoom: vi.fn(),
  onSendMessage: vi.fn(),
  onJoinRoom: vi.fn(),
  onLeaveRoom: vi.fn(),
  onLogout: vi.fn(),
  sendTyping: vi.fn(),
  getUnreadCount: () => 0,
  onCreateRoom: vi.fn(),
};

describe('MainLayout', () => {
  it('renders sidebar and chat panel', () => {
    render(<MainLayout {...baseProps} />);
    expect(document.querySelector('.sidebar')).toBeInTheDocument();
    expect(document.querySelector('.main-content')).toBeInTheDocument();
  });

  it('shows "no room selected" in chat panel when no active room', () => {
    render(<MainLayout {...baseProps} />);
    expect(screen.getByText('// no room selected')).toBeInTheDocument();
  });

  it('calls onSelectRoom when room is selected from sidebar', async () => {
    const onSelectRoom = vi.fn();
    const user = userEvent.setup();
    render(<MainLayout {...baseProps} onSelectRoom={onSelectRoom} />);
    await user.click(screen.getByText('General'));
    expect(onSelectRoom).toHaveBeenCalledWith('!r1:m.org');
  });

  it('sends a regular message via onSendMessage', async () => {
    const onSendMessage = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<MainLayout {...baseProps} activeRoomId="!r1:m.org" onSendMessage={onSendMessage} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello{Enter}');
    await waitFor(() => expect(onSendMessage).toHaveBeenCalledWith('!r1:m.org', 'Hello'));
  });

  it('sends an emote via client.sendEmoteMessage', async () => {
    const sendEmoteMessage = vi.fn().mockResolvedValue();
    const client = { ...baseProps.client, sendEmoteMessage };
    const user = userEvent.setup();
    render(<MainLayout {...baseProps} client={client} activeRoomId="!r1:m.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, '/me waves{Enter}');
    await waitFor(() => expect(sendEmoteMessage).toHaveBeenCalledWith('!r1:m.org', 'waves'));
  });

  it('opens room switcher on Ctrl+K', () => {
    render(<MainLayout {...baseProps} />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(document.querySelector('.switcher-box')).toBeInTheDocument();
  });

  it('closes room switcher on second Ctrl+K', () => {
    render(<MainLayout {...baseProps} />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(document.querySelector('.switcher-box')).not.toBeInTheDocument();
  });

  it('switches room with Alt+1', () => {
    const onSelectRoom = vi.fn();
    render(<MainLayout {...baseProps} onSelectRoom={onSelectRoom} />);
    fireEvent.keyDown(window, { key: '1', altKey: true });
    expect(onSelectRoom).toHaveBeenCalledWith('!r1:m.org');
  });

  it('switches room with Alt+2', () => {
    const onSelectRoom = vi.fn();
    render(<MainLayout {...baseProps} onSelectRoom={onSelectRoom} />);
    fireEvent.keyDown(window, { key: '2', altKey: true });
    expect(onSelectRoom).toHaveBeenCalledWith('!r2:m.org');
  });

  it('does nothing for Alt+key out of range', () => {
    const onSelectRoom = vi.fn();
    render(<MainLayout {...baseProps} onSelectRoom={onSelectRoom} />);
    fireEvent.keyDown(window, { key: '9', altKey: true });
    expect(onSelectRoom).not.toHaveBeenCalled();
  });

  it('opens new conversation dialog on + button click', async () => {
    const user = userEvent.setup();
    render(<MainLayout {...baseProps} />);
    await user.click(screen.getByLabelText('New conversation'));
    expect(screen.getByText('// new conversation')).toBeInTheDocument();
  });

  it('creates a room and selects it', async () => {
    const onCreateRoom = vi.fn().mockResolvedValue('!newroom:m.org');
    const onSelectRoom = vi.fn();
    const user = userEvent.setup();
    render(<MainLayout {...baseProps} onCreateRoom={onCreateRoom} onSelectRoom={onSelectRoom} />);
    await user.click(screen.getByLabelText('New conversation'));
    await user.type(screen.getByPlaceholderText('room name…'), 'New Room');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(onCreateRoom).toHaveBeenCalled());
    await waitFor(() => expect(onSelectRoom).toHaveBeenCalledWith('!newroom:m.org'));
  });

  it('shows E2EE badge when room is encrypted', () => {
    const client = { ...baseProps.client, isRoomEncrypted: () => true };
    const rooms = [makeRoom('!r1:m.org', 'Encrypted')];
    render(
      <MainLayout {...baseProps} client={client} rooms={rooms} activeRoomId="!r1:m.org"
        messages={{ '!r1:m.org': [] }} />
    );
    expect(screen.getByText('E2EE')).toBeInTheDocument();
  });

  it('opens new conversation dialog on c key when no input is focused', () => {
    render(<MainLayout {...baseProps} />);
    fireEvent.keyDown(window, { key: 'c' });
    expect(screen.getByText('// new conversation')).toBeInTheDocument();
  });

  it('does not open new conversation on c key when an input is focused', () => {
    render(<MainLayout {...baseProps} activeRoomId="!r1:m.org" />);
    const input = document.querySelector('.message-input');
    fireEvent.focus(input);
    fireEvent.keyDown(window, { key: 'c' });
    expect(screen.queryByText('// new conversation')).not.toBeInTheDocument();
  });

  it('shows leave confirm dialog on d key with active room', () => {
    render(<MainLayout {...baseProps} activeRoomId="!r1:m.org" />);
    document.activeElement?.blur();
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByText('// leave room?')).toBeInTheDocument();
  });

  it('does not show leave confirm on d key without active room', () => {
    render(<MainLayout {...baseProps} activeRoomId={null} />);
    document.activeElement?.blur();
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.queryByText('// leave room?')).not.toBeInTheDocument();
  });

  it('calls onLeaveRoom after confirming leave with Enter (default Y)', async () => {
    const onLeaveRoom = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<MainLayout {...baseProps} activeRoomId="!r1:m.org" onLeaveRoom={onLeaveRoom} />);
    document.activeElement?.blur();
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByText('// leave room?')).toBeInTheDocument();
    const confirmInput = document.querySelector('.sidebar-room-confirm-input');
    await user.click(confirmInput);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onLeaveRoom).toHaveBeenCalledWith('!r1:m.org'));
  });

  it('calls onLeaveRoom after confirming leave with y + Enter', async () => {
    const onLeaveRoom = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<MainLayout {...baseProps} activeRoomId="!r1:m.org" onLeaveRoom={onLeaveRoom} />);
    document.activeElement?.blur();
    fireEvent.keyDown(window, { key: 'd' });
    const confirmInput = document.querySelector('.sidebar-room-confirm-input');
    await user.click(confirmInput);
    await user.type(confirmInput, 'y');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onLeaveRoom).toHaveBeenCalledWith('!r1:m.org'));
  });

  it('does not call onLeaveRoom when leave is cancelled with n + Enter', async () => {
    const onLeaveRoom = vi.fn();
    const user = userEvent.setup();
    render(<MainLayout {...baseProps} activeRoomId="!r1:m.org" onLeaveRoom={onLeaveRoom} />);
    document.activeElement?.blur();
    fireEvent.keyDown(window, { key: 'd' });
    const confirmInput = document.querySelector('.sidebar-room-confirm-input');
    await user.click(confirmInput);
    await user.type(confirmInput, 'n');
    await user.keyboard('{Enter}');
    expect(onLeaveRoom).not.toHaveBeenCalled();
    expect(screen.queryByText('// leave room?')).not.toBeInTheDocument();
  });

  it('closes leave confirm dialog on Escape', async () => {
    render(<MainLayout {...baseProps} activeRoomId="!r1:m.org" />);
    document.activeElement?.blur();
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByText('// leave room?')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('// leave room?')).not.toBeInTheDocument();
  });
});
