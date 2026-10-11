import AsyncStorage from '@react-native-async-storage/async-storage';
import { countUnread, fetchUnread, markSeen } from '../push/unread';
import { authService } from '../instances';

jest.mock('../instances', () => ({ authService: { getNotices: jest.fn() } }));

const n = (id: number | string) => ({ id, title: 't', body: 'b', area_id: null, createdAt: '' }) as any;
const svc = authService as jest.Mocked<typeof authService>;

beforeEach(() => AsyncStorage.clear());

describe('unread notices', () => {
  it('counts only notices newer than the last seen id, even when ids arrive as strings', () => {
    expect(countUnread([n('9'), n(8), n(5)], 5)).toBe(2);
    expect(countUnread([n(5)], 5)).toBe(0);
  });

  it('everything is unread until the user has opened the tab, then nothing is', async () => {
    svc.getNotices.mockResolvedValue([n(2), n(1)]);
    expect(await fetchUnread('u1')).toBe(2);
    await markSeen('u1', [n(2), n(1)]);
    expect(await fetchUnread('u1')).toBe(0);
    svc.getNotices.mockResolvedValue([n(3), n(2), n(1)]);
    expect(await fetchUnread('u1')).toBe(1);
  });

  it('is tracked per user, and an older list never moves the marker backwards', async () => {
    await markSeen('u1', [n(10)]);
    await markSeen('u1', [n(4)]);
    svc.getNotices.mockResolvedValue([n(10)]);
    expect(await fetchUnread('u1')).toBe(0);
    expect(await fetchUnread('u2')).toBe(1);
  });
});
