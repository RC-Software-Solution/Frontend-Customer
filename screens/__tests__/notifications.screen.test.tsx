import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationsScreen from '../notifications/notifications.screen';
import { authService } from '@/services/instances';
import { store } from '@/store';
import { setUnread } from '@/store/noticesSlice';

jest.mock('@/services/instances', () => ({ authService: { getNotices: jest.fn() } }));
jest.mock('@/services/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
jest.mock('expo-router', () => {
  const React = require('react');
  return { useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]) };
});

const svc = authService as jest.Mocked<typeof authService>;
const notice = (id: number, title: string, body: string) =>
  ({ id, title, body, area_id: null, createdAt: '2026-10-11T04:00:00.000Z' }) as any;

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
  store.dispatch(setUnread(0));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('notifications screen', () => {
  it('lists the notices from the server with title, body and date', async () => {
    svc.getNotices.mockResolvedValue([notice(2, 'Holiday', 'Closed on Friday'), notice(1, 'Menu change', 'New lunch menu')]);
    await render(<Provider store={store}><NotificationsScreen /></Provider>);
    expect(await screen.findByText('Holiday')).toBeTruthy();
    expect(screen.getByText('Closed on Friday')).toBeTruthy();
    expect(screen.getByText('Menu change')).toBeTruthy();
    expect(screen.getAllByText('11 Oct 2026')).toHaveLength(2);
  });

  it('says so when there are no notices', async () => {
    svc.getNotices.mockResolvedValue([]);
    await render(<Provider store={store}><NotificationsScreen /></Provider>);
    expect(await screen.findByText('No notifications yet.')).toBeTruthy();
  });

  it('shows an error with a retry that loads the list', async () => {
    svc.getNotices.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce([notice(1, 'Back online', 'x')]);
    await render(<Provider store={store}><NotificationsScreen /></Provider>);
    fireEvent.press(await screen.findByText('Tap to retry'));
    expect(await screen.findByText('Back online')).toBeTruthy();
    expect(svc.getNotices).toHaveBeenCalledTimes(2);
  });

  it('opening the tab clears the unread badge and remembers the newest notice', async () => {
    store.dispatch(setUnread(2));
    svc.getNotices.mockResolvedValue([notice(7, 'Newer', 'x'), notice(3, 'Older', 'x')]);
    await render(<Provider store={store}><NotificationsScreen /></Provider>);
    await screen.findByText('Newer');
    expect(store.getState().notices.unread).toBe(0);
    expect(await AsyncStorage.getItem('notices_seen_u1')).toBe('7');
  });

  describe('unread cards', () => {
    const open = async () => {
      svc.getNotices.mockResolvedValue([notice(7, 'Newer', 'x'), notice(3, 'Older', 'x')]);
      await render(<Provider store={store}><NotificationsScreen /></Provider>);
      await screen.findByText('Newer');
    };
    const isUnread = (id: number) => within(screen.getByTestId(`notice-${id}`)).queryByLabelText('Unread') !== null;

    it('marks only the notices newer than the last seen one as unread', async () => {
      await AsyncStorage.setItem('notices_seen_u1', '3');
      await open();
      expect(isUnread(7)).toBe(true);
      expect(isUnread(3)).toBe(false);
    });

    it('treats every notice as unread on the first open', async () => {
      await open();
      expect(isUnread(7)).toBe(true);
      expect(isUnread(3)).toBe(true);
    });

    it('keeps the cards that were unread on open highlighted after a pull to refresh', async () => {
      await AsyncStorage.setItem('notices_seen_u1', '3');
      await open();
      expect(await AsyncStorage.getItem('notices_seen_u1')).toBe('7');
      await act(async () => { screen.getByTestId('notices-list').props.refreshControl.props.onRefresh(); });
      expect(svc.getNotices).toHaveBeenCalledTimes(2);
      expect(isUnread(7)).toBe(true);
      expect(isUnread(3)).toBe(false);
    });
  });

  it('shows the error state with a retry button', async () => {
    svc.getNotices.mockRejectedValue(new Error('network'));
    await render(<Provider store={store}><NotificationsScreen /></Provider>);
    expect(await screen.findByText('Could not load notifications.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tap to retry' })).toBeTruthy();
  });

  it('shows the empty state title and message', async () => {
    svc.getNotices.mockResolvedValue([]);
    await render(<Provider store={store}><NotificationsScreen /></Provider>);
    expect(await screen.findByText('No notifications yet.')).toBeTruthy();
    expect(screen.getByText('Announcements from RC Caterings appear here.')).toBeTruthy();
  });
});
