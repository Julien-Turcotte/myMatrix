import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from 'matrix-js-sdk';

const TIMELINE_EVENT_TYPES = ['m.room.message', 'm.room.member', 'm.room.encrypted'];

export function useMatrix() {
  const [client, setClient] = useState(null);
  const [syncState, setSyncState] = useState('STOPPED');
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [error, setError] = useState(null);
  const clientRef = useRef(null);
  const decryptionTimersRef = useRef({});

  const updateRooms = useCallback((c) => {
    const r = (c || clientRef.current)?.getRooms() || [];
    const sorted = [...r].sort((a, b) => {
      const aTs = a.getLastActiveTimestamp() || 0;
      const bTs = b.getLastActiveTimestamp() || 0;
      return bTs - aTs;
    });
    setRooms(sorted);
  }, []);

  const loadRoomMessages = useCallback((roomId, c) => {
    const matrixClient = c || clientRef.current;
    if (!matrixClient) return;
    const room = matrixClient.getRoom(roomId);
    if (!room) return;
    const timeline = room.getLiveTimeline().getEvents();
    const msgs = timeline
      .filter(e => TIMELINE_EVENT_TYPES.includes(e.getType()))
      .map(e => ({
        id: e.getId(),
        type: e.getType(),
        sender: e.getSender(),
        content: e.getContent(),
        timestamp: e.getTs(),
        isLocal: e.status != null,
        isDecryptionFailure: e.isDecryptionFailure?.() ?? false,
      }));
    setMessages(prev => ({ ...prev, [roomId]: msgs }));
  }, []);

  const login = useCallback(async ({ baseUrl, userId, password, accessToken, deviceId }) => {
    try {
      setError(null);
      let matrixClient;

      if (accessToken) {
        matrixClient = createClient({
          baseUrl,
          userId,
          accessToken,
          deviceId: deviceId || `myMatrix_${Date.now()}`,
        });
      } else {
        matrixClient = createClient({ baseUrl });
        const resp = await matrixClient.loginWithPassword(userId, password);
        matrixClient = createClient({
          baseUrl,
          userId: resp.user_id,
          accessToken: resp.access_token,
          deviceId: resp.device_id,
        });
      }

      clientRef.current = matrixClient;

      // initRustCrypto must be called after client creation but before startClient().
      try {
        await matrixClient.initRustCrypto();
      } catch (cryptoErr) {
        console.warn('[useMatrix] initRustCrypto failed:', cryptoErr);
      }

      // Reload messages when encrypted events are decrypted (debounced per room).
      matrixClient.on('Event.decrypted', (event) => {
        const roomId = event.getRoomId();
        if (!roomId) return;
        clearTimeout(decryptionTimersRef.current[roomId]);
        decryptionTimersRef.current[roomId] = setTimeout(() => {
          delete decryptionTimersRef.current[roomId];
          loadRoomMessages(roomId, matrixClient);
        }, 100);
      });

      matrixClient.on('sync', (state) => {
        setSyncState(state);
        if (state === 'PREPARED' || state === 'SYNCING') {
          updateRooms(matrixClient);
        }
      });

      matrixClient.on('Room.timeline', (event, room) => {
        updateRooms(matrixClient);
        if (room) {
          loadRoomMessages(room.roomId, matrixClient);
        }
      });

      matrixClient.on('Room', () => {
        updateRooms(matrixClient);
      });

      matrixClient.on('RoomMember.typing', (event, member) => {
        const roomId = member.roomId;
        setTypingUsers(prev => {
          const roomTyping = { ...(prev[roomId] || {}) };
          if (member.typing) {
            roomTyping[member.userId] = true;
          } else {
            delete roomTyping[member.userId];
          }
          return { ...prev, [roomId]: roomTyping };
        });
      });

      await matrixClient.startClient({ initialSyncLimit: 50 });
      setClient(matrixClient);
      return matrixClient;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  }, [updateRooms, loadRoomMessages]);

  const logout = useCallback(async () => {
    if (clientRef.current) {
      try {
        await clientRef.current.logout();
      } catch (err) {
        console.warn('[useMatrix] logout error:', err);
      }
      clientRef.current.stopClient();
      clientRef.current = null;
    }
    setClient(null);
    setSyncState('STOPPED');
    setRooms([]);
    setActiveRoomId(null);
    setMessages({});
  }, []);

  const selectRoom = useCallback((roomId) => {
    setActiveRoomId(roomId);
    loadRoomMessages(roomId);
    // Mark as read
    if (clientRef.current) {
      const room = clientRef.current.getRoom(roomId);
      if (room) {
        const lastEvent = room.getLiveTimeline().getEvents().slice(-1)[0];
        if (lastEvent) {
          clientRef.current.sendReadReceipt(lastEvent).catch((err) => {
              console.warn('[useMatrix] sendReadReceipt error:', err);
            });
        }
      }
    }
  }, [loadRoomMessages]);

  const sendMessage = useCallback(async (roomId, text) => {
    if (!clientRef.current || !text.trim()) return;
    await clientRef.current.sendTextMessage(roomId, text);
  }, []);

  const sendEmote = useCallback(async (roomId, text) => {
    if (!clientRef.current || !text.trim()) return;
    await clientRef.current.sendEmoteMessage(roomId, text);
  }, []);

  const joinRoom = useCallback(async (roomIdOrAlias) => {
    if (!clientRef.current) return;
    await clientRef.current.joinRoom(roomIdOrAlias);
    updateRooms();
  }, [updateRooms]);

  const leaveRoom = useCallback(async (roomId) => {
    if (!clientRef.current) return;
    await clientRef.current.leave(roomId);
    updateRooms();
    if (activeRoomId === roomId) setActiveRoomId(null);
  }, [activeRoomId, updateRooms]);

  const waitForRoom = useCallback((roomId, { timeoutMs = 5000, intervalMs = 100 } = {}) => {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      let timerId;
      const check = () => {
        const room = clientRef.current?.getRoom(roomId);
        if (room) { resolve(room); return; }
        if (Date.now() - start >= timeoutMs) {
          reject(new Error(`Timed out waiting for room ${roomId}`));
          return;
        }
        timerId = setTimeout(check, intervalMs);
      };
      check();
      return () => clearTimeout(timerId);
    });
  }, []);

  const createRoom = useCallback(async ({ name, isDirect, inviteUserId }) => {
    if (!clientRef.current) throw new Error('Not connected');
    const opts = {};
    if (isDirect && inviteUserId) {
      opts.invite = [inviteUserId];
      opts.is_direct = true;
      opts.preset = 'trusted_private_chat';
    } else if (name) {
      opts.name = name;
    }
    if (Object.keys(opts).length === 0) {
      throw new Error('createRoom requires either a name or isDirect with inviteUserId');
    }
    const result = await clientRef.current.createRoom(opts);
    const roomId = result.room_id;
    try {
      await waitForRoom(roomId);
    } catch (e) {
      console.warn('[useMatrix] createRoom: waiting for room failed:', e);
    }
    updateRooms();
    return roomId;
  }, [updateRooms, waitForRoom]);

  const sendTyping = useCallback((roomId, isTyping) => {
    if (!clientRef.current) return;
    clientRef.current.sendTyping(roomId, isTyping, 3000).catch((err) => {
      console.warn('[useMatrix] sendTyping error:', err);
    });
  }, []);

  const getUnreadCount = useCallback((room) => {
    return room.getUnreadNotificationCount() || 0;
  }, []);

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.stopClient();
      }
    };
  }, []);

  return {
    client,
    syncState,
    rooms,
    activeRoomId,
    messages,
    typingUsers,
    error,
    login,
    logout,
    selectRoom,
    sendMessage,
    sendEmote,
    joinRoom,
    leaveRoom,
    createRoom,
    sendTyping,
    getUnreadCount,
  };
}
