import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatPanel from '../components/ChatPanel';

function makeMsg(overrides = {}) {
  return {
    id: 'evt1',
    type: 'm.room.message',
    sender: '@alice:matrix.org',
    content: { msgtype: 'm.text', body: 'Hello!' },
    timestamp: new Date('2024-01-01T10:05:00').getTime(),
    isLocal: false,
    isDecryptionFailure: false,
    ...overrides,
  };
}

function makeRoom(overrides = {}) {
  return { roomId: '!room1:matrix.org', name: 'General', ...overrides };
}

describe('ChatPanel', () => {
  it('shows neofetch-style welcome panel when room is null', () => {
    render(
      <ChatPanel room={null} messages={{}} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} rooms={[]} />
    );
    expect(document.querySelector('.welcome-panel')).toBeInTheDocument();
    expect(screen.getByText('alice@matrix.org')).toBeInTheDocument();
  });

  it('renders the room name in the header', () => {
    const room = makeRoom();
    render(
      <ChatPanel room={room} messages={{}} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('uses roomId in header when room has no name', () => {
    const room = makeRoom({ name: null });
    render(
      <ChatPanel room={room} messages={{}} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(document.querySelector('.chat-header-name')).toHaveTextContent('!room1:matrix.org');
  });

  it('shows E2EE badge when encrypted', () => {
    const room = makeRoom();
    render(
      <ChatPanel room={room} messages={{}} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={true} />
    );
    expect(screen.getByText('E2EE')).toBeInTheDocument();
  });

  it('does not show E2EE badge when not encrypted', () => {
    const room = makeRoom();
    render(
      <ChatPanel room={room} messages={{}} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.queryByText('E2EE')).not.toBeInTheDocument();
  });

  it('shows "no messages in timeline" when there are no messages', () => {
    const room = makeRoom();
    render(
      <ChatPanel room={room} messages={{ '!room1:matrix.org': [] }} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('-- no messages in timeline --')).toBeInTheDocument();
  });

  it('renders a text message', () => {
    const room = makeRoom();
    const msgs = { '!room1:matrix.org': [makeMsg()] };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('renders the sender name without @ and server part', () => {
    const room = makeRoom();
    const msgs = { '!room1:matrix.org': [makeMsg({ sender: '@bob:homeserver.net' })] };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('renders an emote message', () => {
    const room = makeRoom();
    const msgs = {
      '!room1:matrix.org': [makeMsg({ content: { msgtype: 'm.emote', body: 'waves hello' } })],
    };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('waves hello', { exact: false })).toBeInTheDocument();
    expect(document.querySelector('.msg-emote')).toBeInTheDocument();
  });

  it('renders an image message with placeholder', () => {
    const room = makeRoom();
    const msgs = {
      '!room1:matrix.org': [makeMsg({ content: { msgtype: 'm.image', body: 'photo.png' } })],
    };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('[image: photo.png]')).toBeInTheDocument();
  });

  it('renders a member event (join)', () => {
    const room = makeRoom();
    const msgs = {
      '!room1:matrix.org': [makeMsg({
        type: 'm.room.member',
        content: { membership: 'join' },
      })],
    };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('joined the room', { exact: false })).toBeInTheDocument();
  });

  it('renders a member event (leave)', () => {
    const room = makeRoom();
    const msgs = {
      '!room1:matrix.org': [makeMsg({
        type: 'm.room.member',
        content: { membership: 'leave', prev_membership: 'join' },
      })],
    };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('left the room', { exact: false })).toBeInTheDocument();
  });

  it('renders a member event (invite rejected)', () => {
    const room = makeRoom();
    const msgs = {
      '!room1:matrix.org': [makeMsg({
        type: 'm.room.member',
        content: { membership: 'leave', prev_membership: 'invite' },
      })],
    };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('rejected invite', { exact: false })).toBeInTheDocument();
  });

  it('renders a member event (invite)', () => {
    const room = makeRoom();
    const msgs = {
      '!room1:matrix.org': [makeMsg({
        type: 'm.room.member',
        content: { membership: 'invite' },
      })],
    };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('was invited', { exact: false })).toBeInTheDocument();
  });

  it('renders a member event (ban)', () => {
    const room = makeRoom();
    const msgs = {
      '!room1:matrix.org': [makeMsg({
        type: 'm.room.member',
        content: { membership: 'ban' },
      })],
    };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('was banned', { exact: false })).toBeInTheDocument();
  });

  it('renders a decryption failure message', () => {
    const room = makeRoom();
    const msgs = {
      '!room1:matrix.org': [makeMsg({
        type: 'm.room.encrypted',
        isDecryptionFailure: true,
        content: {},
      })],
    };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('[unable to decrypt]')).toBeInTheDocument();
  });

  it('shows typing indicator for other users', () => {
    const room = makeRoom();
    render(
      <ChatPanel
        room={room}
        messages={{}}
        typingUsers={{ '!room1:matrix.org': { '@bob:matrix.org': true } }}
        currentUserId="@alice:matrix.org"
        isEncrypted={false}
      />
    );
    expect(screen.getByText('bob is typing', { exact: false })).toBeInTheDocument();
  });

  it('does not show typing indicator for current user', () => {
    const room = makeRoom();
    render(
      <ChatPanel
        room={room}
        messages={{}}
        typingUsers={{ '!room1:matrix.org': { '@alice:matrix.org': true } }}
        currentUserId="@alice:matrix.org"
        isEncrypted={false}
      />
    );
    expect(screen.queryByText('is typing', { exact: false })).not.toBeInTheDocument();
  });

  it('shows "are typing" for multiple users', () => {
    const room = makeRoom();
    render(
      <ChatPanel
        room={room}
        messages={{}}
        typingUsers={{ '!room1:matrix.org': { '@bob:m.org': true, '@carol:m.org': true } }}
        currentUserId="@alice:matrix.org"
        isEncrypted={false}
      />
    );
    expect(screen.getByText('are typing', { exact: false })).toBeInTheDocument();
  });

  it('strips reply prefix from message body', () => {
    const room = makeRoom();
    const msgs = {
      '!room1:matrix.org': [makeMsg({
        content: {
          msgtype: 'm.text',
          body: '> <@alice:matrix.org> original\n\nActual reply',
          'm.relates_to': { 'm.in_reply_to': { event_id: '$evt0' } },
        },
      })],
    };
    render(
      <ChatPanel room={room} messages={msgs} typingUsers={{}} currentUserId="@alice:matrix.org" isEncrypted={false} />
    );
    expect(screen.getByText('Actual reply')).toBeInTheDocument();
  });
});
