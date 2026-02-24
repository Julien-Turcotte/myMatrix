import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '../components/MessageInput';

describe('MessageInput', () => {
  it('renders the input element', () => {
    render(<MessageInput onSend={vi.fn()} roomId="!r:m.org" userId="@alice:matrix.org" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows the username and host in the prompt', () => {
    render(<MessageInput onSend={vi.fn()} roomId="!r:m.org" userId="@alice:matrix.org" />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('matrix.org')).toBeInTheDocument();
  });

  it('defaults prompt to "user" and "matrix" when userId is empty', () => {
    render(<MessageInput onSend={vi.fn()} roomId="!r:m.org" userId="" />);
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('matrix')).toBeInTheDocument();
  });

  it('shows disabled placeholder when disabled', () => {
    render(<MessageInput onSend={vi.fn()} roomId={null} userId="@alice:matrix.org" disabled />);
    expect(screen.getByPlaceholderText('select a room...')).toBeInTheDocument();
  });

  it('shows active placeholder when enabled', () => {
    render(<MessageInput onSend={vi.fn()} roomId="!r:m.org" userId="@alice:matrix.org" />);
    expect(screen.getByPlaceholderText('type a message... (/join /leave /me)')).toBeInTheDocument();
  });

  it('calls onSend with typed text on Enter', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageInput onSend={onSend} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello world');
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith('Hello world');
  });

  it('clears the input after sending', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('');
  });

  it('does not call onSend for whitespace-only input', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageInput onSend={onSend} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, '   ');
    await user.keyboard('{Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('handles Ctrl+Enter to send', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageInput onSend={onSend} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'hi');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSend).toHaveBeenCalledWith('hi');
  });

  it('clears input on Escape', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'some text');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
  });

  it('calls onJoin for /join command', async () => {
    const onJoin = vi.fn();
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} onJoin={onJoin} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, '/join #general:matrix.org');
    await user.keyboard('{Enter}');
    expect(onJoin).toHaveBeenCalledWith('#general:matrix.org');
  });

  it('calls onLeave for /leave command', async () => {
    const onLeave = vi.fn();
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} onLeave={onLeave} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, '/leave');
    await user.keyboard('{Enter}');
    expect(onLeave).toHaveBeenCalledWith('!r:m.org');
  });

  it('passes /me emote text to onSend unchanged', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageInput onSend={onSend} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, '/me waves');
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith('/me waves');
  });

  it('calls onTyping with true when user starts typing', async () => {
    const onTyping = vi.fn();
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} onTyping={onTyping} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'a');
    expect(onTyping).toHaveBeenCalledWith('!r:m.org', true);
  });

  it('calls onTyping with false on Escape', async () => {
    const onTyping = vi.fn();
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} onTyping={onTyping} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');
    await user.keyboard('{Escape}');
    expect(onTyping).toHaveBeenCalledWith('!r:m.org', false);
  });

  it('calls onTyping with false when sending', async () => {
    const onTyping = vi.fn();
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} onTyping={onTyping} roomId="!r:m.org" userId="@alice:matrix.org" />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'hi');
    await user.keyboard('{Enter}');
    expect(onTyping).toHaveBeenCalledWith('!r:m.org', false);
  });
});
