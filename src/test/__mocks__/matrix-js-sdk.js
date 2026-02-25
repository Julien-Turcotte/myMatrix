import { vi } from 'vitest';

export const mockClient = {
  loginWithPassword: vi.fn(),
  initRustCrypto: vi.fn().mockResolvedValue(),
  startClient: vi.fn().mockResolvedValue(),
  stopClient: vi.fn(),
  logout: vi.fn().mockResolvedValue(),
  getRooms: vi.fn().mockReturnValue([]),
  getRoom: vi.fn().mockReturnValue(null),
  sendTextMessage: vi.fn().mockResolvedValue(),
  sendEmoteMessage: vi.fn().mockResolvedValue(),
  sendTyping: vi.fn().mockResolvedValue(),
  sendReadReceipt: vi.fn().mockResolvedValue(),
  joinRoom: vi.fn().mockResolvedValue(),
  leave: vi.fn().mockResolvedValue(),
  createRoom: vi.fn().mockResolvedValue({ room_id: '!newroom:matrix.org' }),
  getUserId: vi.fn().mockReturnValue('@alice:matrix.org'),
  isRoomEncrypted: vi.fn().mockReturnValue(false),
  on: vi.fn(),
  off: vi.fn(),
};

export const createClient = vi.fn().mockReturnValue(mockClient);
