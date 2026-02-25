import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('matrix-js-sdk', () => import('../test/__mocks__/matrix-js-sdk.js'));

import { useMatrix } from '../hooks/useMatrix';
import { mockClient, createClient } from '../test/__mocks__/matrix-js-sdk.js';

function resetMocks() {
  vi.clearAllMocks();
  mockClient.initRustCrypto.mockResolvedValue();
  mockClient.startClient.mockResolvedValue();
  mockClient.logout.mockResolvedValue();
  mockClient.getRooms.mockReturnValue([]);
  mockClient.getRoom.mockReturnValue(null);
  mockClient.sendTextMessage.mockResolvedValue();
  mockClient.sendTyping.mockResolvedValue();
  mockClient.sendReadReceipt.mockResolvedValue();
  mockClient.joinRoom.mockResolvedValue();
  mockClient.leave.mockResolvedValue();
  mockClient.createRoom.mockResolvedValue({ room_id: '!newroom:matrix.org' });
  mockClient.loginWithPassword.mockResolvedValue({
    user_id: '@alice:matrix.org',
    access_token: 'token123',
    device_id: 'DEV1',
  });
  createClient.mockReturnValue(mockClient);
}

describe('useMatrix', () => {
  beforeEach(resetMocks);

  it('initializes with default state', () => {
    const { result } = renderHook(() => useMatrix());
    expect(result.current.client).toBeNull();
    expect(result.current.syncState).toBe('STOPPED');
    expect(result.current.rooms).toEqual([]);
    expect(result.current.activeRoomId).toBeNull();
    expect(result.current.messages).toEqual({});
    expect(result.current.typingUsers).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('login with accessToken creates client directly', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'mytoken',
        deviceId: 'DEV1',
      });
    });
    expect(createClient).toHaveBeenCalledWith(expect.objectContaining({
      baseUrl: 'https://matrix.org',
      userId: '@alice:matrix.org',
      accessToken: 'mytoken',
    }));
    expect(mockClient.startClient).toHaveBeenCalledWith({ initialSyncLimit: 50 });
    expect(result.current.client).toBe(mockClient);
  });

  it('login with password calls loginWithPassword', async () => {
    // First createClient call returns a temp client for loginWithPassword
    const tempClient = { loginWithPassword: vi.fn().mockResolvedValue({
      user_id: '@alice:matrix.org',
      access_token: 'tok',
      device_id: 'DEV2',
    }) };
    createClient
      .mockReturnValueOnce(tempClient)
      .mockReturnValue(mockClient);

    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        password: 'secret',
      });
    });
    expect(tempClient.loginWithPassword).toHaveBeenCalledWith('@alice:matrix.org', 'secret');
    expect(result.current.client).toBe(mockClient);
  });

  it('login sets error state on failure', async () => {
    mockClient.startClient.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      try {
        await result.current.login({
          baseUrl: 'https://matrix.org',
          userId: '@alice:matrix.org',
          accessToken: 'token',
        });
      } catch {
        // expected
      }
    });
    expect(result.current.error).toBe('Network error');
  });

  it('logout resets all state', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.client).toBeNull();
    expect(result.current.syncState).toBe('STOPPED');
    expect(result.current.rooms).toEqual([]);
    expect(result.current.activeRoomId).toBeNull();
    expect(result.current.messages).toEqual({});
    expect(mockClient.stopClient).toHaveBeenCalled();
  });

  it('selectRoom sets activeRoomId', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    act(() => {
      result.current.selectRoom('!room1:matrix.org');
    });
    expect(result.current.activeRoomId).toBe('!room1:matrix.org');
  });

  it('sendMessage calls client.sendTextMessage', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    await act(async () => {
      await result.current.sendMessage('!room1:matrix.org', 'Hello!');
    });
    expect(mockClient.sendTextMessage).toHaveBeenCalledWith('!room1:matrix.org', 'Hello!');
  });

  it('sendMessage does nothing for empty text', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    await act(async () => {
      await result.current.sendMessage('!room1:matrix.org', '   ');
    });
    expect(mockClient.sendTextMessage).not.toHaveBeenCalled();
  });

  it('sendMessage does nothing when not logged in', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.sendMessage('!room1:matrix.org', 'Hi');
    });
    expect(mockClient.sendTextMessage).not.toHaveBeenCalled();
  });

  it('joinRoom calls client.joinRoom', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    await act(async () => {
      await result.current.joinRoom('#general:matrix.org');
    });
    expect(mockClient.joinRoom).toHaveBeenCalledWith('#general:matrix.org');
  });

  it('leaveRoom calls client.leave', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    await act(async () => {
      await result.current.leaveRoom('!room1:matrix.org');
    });
    expect(mockClient.leave).toHaveBeenCalledWith('!room1:matrix.org');
  });

  it('leaveRoom clears activeRoomId when leaving active room', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    act(() => { result.current.selectRoom('!room1:matrix.org'); });
    await act(async () => {
      await result.current.leaveRoom('!room1:matrix.org');
    });
    expect(result.current.activeRoomId).toBeNull();
  });

  it('createRoom throws when not connected', async () => {
    const { result } = renderHook(() => useMatrix());
    await expect(
      act(async () => {
        await result.current.createRoom({ name: 'Test' });
      })
    ).rejects.toThrow('Not connected');
  });

  it('createRoom calls client.createRoom with name', async () => {
    mockClient.getRoom.mockReturnValue({ roomId: '!newroom:matrix.org' });
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    let roomId;
    await act(async () => {
      roomId = await result.current.createRoom({ name: 'My Room' });
    });
    expect(mockClient.createRoom).toHaveBeenCalledWith({ name: 'My Room' });
    expect(roomId).toBe('!newroom:matrix.org');
  });

  it('createRoom calls client.createRoom for DM', async () => {
    mockClient.getRoom.mockReturnValue({ roomId: '!newroom:matrix.org' });
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    await act(async () => {
      await result.current.createRoom({ isDirect: true, inviteUserId: '@bob:matrix.org' });
    });
    expect(mockClient.createRoom).toHaveBeenCalledWith({
      invite: ['@bob:matrix.org'],
      is_direct: true,
      preset: 'trusted_private_chat',
    });
  });

  it('createRoom throws when neither name nor isDirect+inviteUserId provided', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    await expect(
      act(async () => {
        await result.current.createRoom({});
      })
    ).rejects.toThrow('createRoom requires either a name or isDirect with inviteUserId');
  });

  it('sendTyping calls client.sendTyping', async () => {
    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });
    act(() => {
      result.current.sendTyping('!room1:matrix.org', true);
    });
    expect(mockClient.sendTyping).toHaveBeenCalledWith('!room1:matrix.org', true, 3000);
  });

  it('getUnreadCount returns 0 for room with no unread', () => {
    const { result } = renderHook(() => useMatrix());
    const room = { getUnreadNotificationCount: () => 0 };
    expect(result.current.getUnreadCount(room)).toBe(0);
  });

  it('getUnreadCount returns count from room', () => {
    const { result } = renderHook(() => useMatrix());
    const room = { getUnreadNotificationCount: () => 5 };
    expect(result.current.getUnreadCount(room)).toBe(5);
  });

  it('sync event handler updates syncState and rooms', async () => {
    let syncHandler;
    mockClient.on.mockImplementation((event, handler) => {
      if (event === 'sync') syncHandler = handler;
    });
    mockClient.getRooms.mockReturnValue([
      { roomId: '!r1:m.org', name: 'General', getLastActiveTimestamp: () => 0 },
    ]);

    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });

    act(() => {
      syncHandler('SYNCING');
    });

    expect(result.current.syncState).toBe('SYNCING');
    expect(result.current.rooms).toHaveLength(1);
  });

  it('Room.timeline event triggers room and message updates', async () => {
    const eventHandlers = {};
    mockClient.on.mockImplementation((event, handler) => {
      eventHandlers[event] = handler;
    });

    const mockRoom = {
      roomId: '!r1:m.org',
      name: 'General',
      getLastActiveTimestamp: () => 0,
      getLiveTimeline: () => ({ getEvents: () => [] }),
    };
    mockClient.getRooms.mockReturnValue([mockRoom]);
    mockClient.getRoom.mockReturnValue(mockRoom);

    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });

    act(() => {
      eventHandlers['Room.timeline']({}, mockRoom);
    });

    expect(result.current.rooms).toHaveLength(1);
  });

  it('RoomMember.typing updates typingUsers', async () => {
    const eventHandlers = {};
    mockClient.on.mockImplementation((event, handler) => {
      eventHandlers[event] = handler;
    });

    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });

    act(() => {
      eventHandlers['RoomMember.typing']({}, {
        roomId: '!r1:m.org',
        userId: '@bob:matrix.org',
        typing: true,
      });
    });

    expect(result.current.typingUsers['!r1:m.org']['@bob:matrix.org']).toBe(true);

    act(() => {
      eventHandlers['RoomMember.typing']({}, {
        roomId: '!r1:m.org',
        userId: '@bob:matrix.org',
        typing: false,
      });
    });

    expect(result.current.typingUsers['!r1:m.org']['@bob:matrix.org']).toBeUndefined();
  });

  it('loadRoomMessages correctly maps timeline events', async () => {
    const mockRoom = {
      roomId: '!r1:m.org',
      name: 'General',
      getLastActiveTimestamp: () => 0,
      getLiveTimeline: () => ({
        getEvents: () => [
          {
            getId: () => 'evt1',
            getType: () => 'm.room.message',
            getSender: () => '@alice:matrix.org',
            getContent: () => ({ msgtype: 'm.text', body: 'Hello' }),
            getTs: () => 1700000000000,
            status: null,
            isDecryptionFailure: () => false,
          },
        ],
      }),
    };
    mockClient.getRoom.mockReturnValue(mockRoom);

    const { result } = renderHook(() => useMatrix());
    await act(async () => {
      await result.current.login({
        baseUrl: 'https://matrix.org',
        userId: '@alice:matrix.org',
        accessToken: 'token',
      });
    });

    act(() => {
      result.current.selectRoom('!r1:m.org');
    });

    expect(result.current.messages['!r1:m.org']).toHaveLength(1);
    expect(result.current.messages['!r1:m.org'][0].content.body).toBe('Hello');
  });
});
