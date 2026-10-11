/**
 * Unread badge for announcements. "Seen" is the highest notice id the user has
 * had on screen, kept per user on this device (the server has no read state).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notice } from '../types/api.types';
import { authService } from '../instances';

const key = (userId: string | number) => `notices_seen_${userId}`;

// ids are BIGINT, so mysql2 may hand them over as strings
const maxId = (notices: Notice[]) => notices.reduce((m, n) => Math.max(m, Number(n.id)), 0);

export const countUnread = (notices: Notice[], seenId: number) =>
  notices.filter((n) => Number(n.id) > seenId).length;

const readSeen = async (userId: string | number) => Number((await AsyncStorage.getItem(key(userId))) ?? 0) || 0;

/** Fetch the notices and count the ones newer than what the user last saw. */
export async function fetchUnread(userId: string | number): Promise<number> {
  return countUnread(await authService.getNotices(), await readSeen(userId));
}

/** Everything in `notices` is now seen. */
export async function markSeen(userId: string | number, notices: Notice[]) {
  const id = maxId(notices);
  if (id > (await readSeen(userId))) await AsyncStorage.setItem(key(userId), String(id));
}
