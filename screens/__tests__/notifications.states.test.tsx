import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
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
const OFFLINE = { status: 0, code: 'NETWORK_ERROR', message: 'Network error - please check your connection' };
const notice = (id: number, title: string, body: string) =>
  ({ id, title, body, area_id: null, createdAt: '2026-10-11T04:00:00.000Z' }) as any;
const mount = () => render(<Provider store={store}><NotificationsScreen /></Provider>);

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
  store.dispatch(setUnread(0));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it('the first load shows a skeleton instead of a spinner', async () => {
  svc.getNotices.mockReturnValue(new Promise(() => {}));
  await mount();
  expect(screen.getByLabelText('Loading')).toBeTruthy();
});

it('an offline first load keeps the title and button and adds the offline sentence', async () => {
  svc.getNotices.mockRejectedValueOnce(OFFLINE).mockResolvedValueOnce([notice(1, 'Back online', 'x')]);
  await mount();
  expect(await screen.findByText('Could not load notifications.')).toBeTruthy();
  expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Back online')).toBeTruthy();
  expect(screen.queryByText('Could not load notifications.')).toBeNull();
});

it('a server failure says something went wrong', async () => {
  svc.getNotices.mockRejectedValue({ status: 500, message: 'Server error' });
  await mount();
  expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
});

it('a failure after a good load keeps the notices and shows one muted line, which a good refresh removes', async () => {
  svc.getNotices.mockResolvedValueOnce([notice(2, 'Holiday', 'Closed on Friday')]);
  await mount();
  expect(await screen.findByText('Holiday')).toBeTruthy();

  svc.getNotices.mockRejectedValueOnce(OFFLINE);
  await act(async () => { await screen.getByTestId('notices-list').props.refreshControl.props.onRefresh(); });
  expect(screen.getByText('Holiday')).toBeTruthy();
  expect(screen.getByText("Couldn't refresh. Pull down to try again.").props.accessibilityLiveRegion).toBe('polite');
  expect(screen.queryByText('Could not load notifications.')).toBeNull();

  svc.getNotices.mockResolvedValueOnce([notice(2, 'Holiday', 'Closed on Friday')]);
  await act(async () => { await screen.getByTestId('notices-list').props.refreshControl.props.onRefresh(); });
  expect(screen.queryByText("Couldn't refresh. Pull down to try again.")).toBeNull();
});
