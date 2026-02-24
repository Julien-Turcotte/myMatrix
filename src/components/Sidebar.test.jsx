import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '../components/Sidebar';

function makeRoom(id, name, overrides = {}) {
  return {
    roomId: id,
    name,
    getDMInviter: () => null,
    ...overrides,
  };
}

describe('Sidebar', () => {
  const defaultProps = {
    rooms: [],
    activeRoomId: null,
    onSelectRoom: vi.fn(),
    onLeaveRoom: vi.fn(),
    onLogout: vi.fn(),
    syncState: 'STOPPED',
    getUnreadCount: () => 0,
    userId: '@alice:matrix.org',
    onNewConversation: vi.fn(),
  };

  it('renders the sidebar with logo', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getAllByText('myMatrix').length).toBeGreaterThan(0);
  });

  it('shows "no rooms joined" when rooms is empty', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('no rooms joined')).toBeInTheDocument();
  });

  it('renders room names', () => {
    const rooms = [makeRoom('!r1:m.org', 'General'), makeRoom('!r2:m.org', 'Dev')];
    render(<Sidebar {...defaultProps} rooms={rooms} />);
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Dev')).toBeInTheDocument();
  });

  it('calls onSelectRoom when a room is clicked', async () => {
    const onSelectRoom = vi.fn();
    const user = userEvent.setup();
    const rooms = [makeRoom('!r1:m.org', 'General')];
    render(<Sidebar {...defaultProps} rooms={rooms} onSelectRoom={onSelectRoom} />);
    await user.click(screen.getByText('General'));
    expect(onSelectRoom).toHaveBeenCalledWith('!r1:m.org');
  });

  it('highlights the active room', () => {
    const rooms = [makeRoom('!r1:m.org', 'General')];
    render(<Sidebar {...defaultProps} rooms={rooms} activeRoomId="!r1:m.org" />);
    const roomEl = document.querySelector('.sidebar-room.active');
    expect(roomEl).toBeInTheDocument();
  });

  it('shows unread badge when count > 0', () => {
    const rooms = [makeRoom('!r1:m.org', 'General')];
    render(<Sidebar {...defaultProps} rooms={rooms} getUnreadCount={() => 5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows "99+" for unread count > 99', () => {
    const rooms = [makeRoom('!r1:m.org', 'General')];
    render(<Sidebar {...defaultProps} rooms={rooms} getUnreadCount={() => 150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('does not show badge when unread is 0', () => {
    const rooms = [makeRoom('!r1:m.org', 'General')];
    render(<Sidebar {...defaultProps} rooms={rooms} getUnreadCount={() => 0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows keyboard shortcut for first 9 rooms', () => {
    const rooms = [makeRoom('!r1:m.org', 'General')];
    render(<Sidebar {...defaultProps} rooms={rooms} />);
    expect(screen.getByText('alt+1')).toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', async () => {
    const onLogout = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} onLogout={onLogout} />);
    await user.click(screen.getByText('[logout]'));
    expect(onLogout).toHaveBeenCalled();
  });

  it('shows the userId in the sidebar', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('shows SYNCING state with correct indicator', () => {
    render(<Sidebar {...defaultProps} syncState="SYNCING" />);
    const indicator = document.querySelector('.sync-ok');
    expect(indicator).toBeInTheDocument();
  });

  it('shows STOPPED state with correct indicator', () => {
    render(<Sidebar {...defaultProps} syncState="STOPPED" />);
    const indicator = document.querySelector('.sync-stopped');
    expect(indicator).toBeInTheDocument();
  });

  it('shows ERROR state with correct indicator', () => {
    render(<Sidebar {...defaultProps} syncState="ERROR" />);
    const indicator = document.querySelector('.sync-err');
    expect(indicator).toBeInTheDocument();
  });

  it('truncates long room names', () => {
    const longName = 'A very long room name that exceeds the limit';
    const rooms = [makeRoom('!r1:m.org', longName)];
    render(<Sidebar {...defaultProps} rooms={rooms} />);
    // The name should be truncated
    expect(screen.queryByText(longName)).not.toBeInTheDocument();
    expect(screen.getByText(/A very long room name/)).toBeInTheDocument();
  });

  it('calls onNewConversation when + button is clicked', async () => {
    const onNewConversation = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} onNewConversation={onNewConversation} />);
    await user.click(screen.getByLabelText('New conversation'));
    expect(onNewConversation).toHaveBeenCalled();
  });

  it('shows leave button for each room', () => {
    const rooms = [makeRoom('!r1:m.org', 'General')];
    render(<Sidebar {...defaultProps} rooms={rooms} />);
    expect(screen.getByLabelText('Leave room')).toBeInTheDocument();
  });

  it('calls onLeaveRoom after confirming leave dialog', async () => {
    const onLeaveRoom = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const rooms = [makeRoom('!r1:m.org', 'General')];
    render(<Sidebar {...defaultProps} rooms={rooms} onLeaveRoom={onLeaveRoom} />);
    await user.click(screen.getByLabelText('Leave room'));
    await waitFor(() => expect(onLeaveRoom).toHaveBeenCalledWith('!r1:m.org'));
    vi.restoreAllMocks();
  });

  it('does not call onLeaveRoom when confirm is cancelled', async () => {
    const onLeaveRoom = vi.fn();
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const rooms = [makeRoom('!r1:m.org', 'General')];
    render(<Sidebar {...defaultProps} rooms={rooms} onLeaveRoom={onLeaveRoom} />);
    await user.click(screen.getByLabelText('Leave room'));
    expect(onLeaveRoom).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('uses @ prefix for DM rooms', () => {
    const dmRoom = makeRoom('!dm1:m.org', 'Bob', { getDMInviter: () => '@bob:matrix.org' });
    render(<Sidebar {...defaultProps} rooms={[dmRoom]} />);
    expect(screen.getByText('@')).toBeInTheDocument();
  });
});
