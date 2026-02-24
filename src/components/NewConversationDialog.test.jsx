import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewConversationDialog from '../components/NewConversationDialog';

describe('NewConversationDialog', () => {
  it('renders the dialog header', () => {
    render(<NewConversationDialog onClose={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText('// new conversation')).toBeInTheDocument();
  });

  it('defaults to room mode', () => {
    render(<NewConversationDialog onClose={vi.fn()} onCreate={vi.fn()} />);
    const roomTab = screen.getByRole('tab', { name: '# room' });
    expect(roomTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to DM mode on tab click', async () => {
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={vi.fn()} />);
    await user.click(screen.getByRole('tab', { name: '@ direct message' }));
    const dmTab = screen.getByRole('tab', { name: '@ direct message' });
    expect(dmTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows room name placeholder in room mode', () => {
    render(<NewConversationDialog onClose={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByPlaceholderText('room name…')).toBeInTheDocument();
  });

  it('shows user:server placeholder in DM mode', async () => {
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={vi.fn()} />);
    await user.click(screen.getByRole('tab', { name: '@ direct message' }));
    expect(screen.getByPlaceholderText('user:server.com')).toBeInTheDocument();
  });

  it('create button is disabled when input is empty', () => {
    render(<NewConversationDialog onClose={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText('[create]')).toBeDisabled();
  });

  it('create button is enabled when input is non-empty', async () => {
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('room name…'), 'My Room');
    expect(screen.getByText('[create]')).not.toBeDisabled();
  });

  it('calls onCreate with room name in room mode', async () => {
    const onCreate = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={onCreate} />);
    await user.type(screen.getByPlaceholderText('room name…'), 'My Room');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({
      isDirect: false,
      name: 'My Room',
      inviteUserId: undefined,
    }));
  });

  it('calls onCreate with DM userId when valid format', async () => {
    const onCreate = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={onCreate} />);
    await user.click(screen.getByRole('tab', { name: '@ direct message' }));
    await user.type(screen.getByPlaceholderText('user:server.com'), '@bob:matrix.org');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({
      isDirect: true,
      name: undefined,
      inviteUserId: '@bob:matrix.org',
    }));
  });

  it('auto-prepends @ for DM userId without it', async () => {
    const onCreate = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={onCreate} />);
    await user.click(screen.getByRole('tab', { name: '@ direct message' }));
    await user.type(screen.getByPlaceholderText('user:server.com'), 'bob:matrix.org');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({
      isDirect: true,
      name: undefined,
      inviteUserId: '@bob:matrix.org',
    }));
  });

  it('shows validation error for invalid DM user ID format', async () => {
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={vi.fn()} />);
    await user.click(screen.getByRole('tab', { name: '@ direct message' }));
    await user.type(screen.getByPlaceholderText('user:server.com'), 'notvalid');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(screen.getByText('User ID must be in format user:server.com')).toBeInTheDocument());
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<NewConversationDialog onClose={onClose} onCreate={vi.fn()} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when overlay is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={onClose} onCreate={vi.fn()} />);
    const overlay = document.querySelector('.switcher-overlay');
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose after successful creation', async () => {
    const onCreate = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={onClose} onCreate={onCreate} />);
    await user.type(screen.getByPlaceholderText('room name…'), 'Test');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows friendly error for M_NOT_FOUND', async () => {
    const err = Object.assign(new Error('User not found'), { errcode: 'M_NOT_FOUND' });
    const onCreate = vi.fn().mockRejectedValue(err);
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={onCreate} />);
    await user.click(screen.getByRole('tab', { name: '@ direct message' }));
    await user.type(screen.getByPlaceholderText('user:server.com'), '@ghost:matrix.org');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(screen.getByText('User not found. Check the user ID and try again.')).toBeInTheDocument());
  });

  it('shows friendly error for M_FORBIDDEN', async () => {
    const err = Object.assign(new Error('Forbidden'), { errcode: 'M_FORBIDDEN' });
    const onCreate = vi.fn().mockRejectedValue(err);
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={onCreate} />);
    await user.click(screen.getByRole('tab', { name: '@ direct message' }));
    await user.type(screen.getByPlaceholderText('user:server.com'), '@blocked:matrix.org');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(screen.getByText('You are not allowed to start a direct message with this user.')).toBeInTheDocument());
  });

  it('shows friendly error for network errors', async () => {
    const err = Object.assign(new Error('ECONNREFUSED'), { name: 'NetworkError' });
    const onCreate = vi.fn().mockRejectedValue(err);
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={onCreate} />);
    await user.click(screen.getByRole('tab', { name: '@ direct message' }));
    await user.type(screen.getByPlaceholderText('user:server.com'), '@bob:matrix.org');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(screen.getByText('Cannot reach the homeserver. Check your internet connection and try again.')).toBeInTheDocument());
  });

  it('shows raw error message for unhandled room creation errors', async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error('Something went wrong'));
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={onCreate} />);
    await user.type(screen.getByPlaceholderText('room name…'), 'Bad Room');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(screen.getByText('Something went wrong')).toBeInTheDocument());
  });

  it('shows "creating…" while submitting', async () => {
    let resolveCreate;
    const onCreate = vi.fn().mockReturnValue(new Promise(r => { resolveCreate = r; }));
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={onCreate} />);
    await user.type(screen.getByPlaceholderText('room name…'), 'Test');
    await user.click(screen.getByText('[create]'));
    await waitFor(() => expect(screen.getByText('creating…')).toBeInTheDocument());
    resolveCreate();
  });

  it('clears value and error when switching mode', async () => {
    const user = userEvent.setup();
    render(<NewConversationDialog onClose={vi.fn()} onCreate={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('room name…'), 'someroom');
    await user.click(screen.getByRole('tab', { name: '@ direct message' }));
    expect(screen.getByPlaceholderText('user:server.com')).toHaveValue('');
  });
});
