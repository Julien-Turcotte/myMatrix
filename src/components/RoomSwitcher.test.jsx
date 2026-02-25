import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoomSwitcher from '../components/RoomSwitcher';

function makeRoom(id, name) {
  return { roomId: id, name };
}

const rooms = [
  makeRoom('!general:m.org', 'General'),
  makeRoom('!dev:m.org', 'Development'),
  makeRoom('!random:m.org', 'Random'),
];

describe('RoomSwitcher', () => {
  it('renders the room switcher header', () => {
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('// room switcher')).toBeInTheDocument();
  });

  it('renders all rooms initially', () => {
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByText('Random')).toBeInTheDocument();
  });

  it('filters rooms by query', async () => {
    const user = userEvent.setup();
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('fuzzy search rooms...');
    await user.type(input, 'dev');
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.queryByText('General')).not.toBeInTheDocument();
    expect(screen.queryByText('Random')).not.toBeInTheDocument();
  });

  it('shows "no rooms match" when filter has no results', async () => {
    const user = userEvent.setup();
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('fuzzy search rooms...');
    await user.type(input, 'zzznomatch');
    expect(screen.getByText('no rooms match')).toBeInTheDocument();
  });

  it('calls onSelect and onClose when a room is clicked', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<RoomSwitcher rooms={rooms} onSelect={onSelect} onClose={onClose} />);
    await user.click(screen.getByText('General'));
    expect(onSelect).toHaveBeenCalledWith('!general:m.org');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={onClose} />);
    const overlay = document.querySelector('.switcher-overlay');
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates down with ArrowDown', async () => {
    const user = userEvent.setup();
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('fuzzy search rooms...');
    await user.type(input, '{ArrowDown}');
    const items = document.querySelectorAll('.switcher-item-active');
    expect(items.length).toBe(1);
  });

  it('navigates up with ArrowUp and wraps around', async () => {
    const user = userEvent.setup();
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('fuzzy search rooms...');
    // ArrowUp from first should wrap to last
    await user.type(input, '{ArrowUp}');
    const activeItem = document.querySelector('.switcher-item-active');
    expect(activeItem).toHaveTextContent('Random');
  });

  it('selects room on Enter key', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<RoomSwitcher rooms={rooms} onSelect={onSelect} onClose={onClose} />);
    const input = screen.getByPlaceholderText('fuzzy search rooms...');
    await user.type(input, '{Enter}');
    expect(onSelect).toHaveBeenCalledWith('!general:m.org');
  });

  it('navigates with Tab key', async () => {
    const user = userEvent.setup();
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('fuzzy search rooms...');
    await user.type(input, '{Tab}');
    const activeItem = document.querySelector('.switcher-item-active');
    expect(activeItem).toHaveTextContent('Development');
  });

  it('resets selection to 0 when query changes', async () => {
    const user = userEvent.setup();
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('fuzzy search rooms...');
    await user.type(input, '{ArrowDown}');
    await user.type(input, 'g');
    const activeItem = document.querySelector('.switcher-item-active');
    expect(activeItem).toHaveTextContent('General');
  });

  it('filters by room ID localpart', async () => {
    const user = userEvent.setup();
    render(<RoomSwitcher rooms={rooms} onSelect={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('fuzzy search rooms...');
    await user.type(input, '!random');
    expect(screen.getByText('Random')).toBeInTheDocument();
  });
});
