import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import NotificationsScreen from '../notifications/notifications.screen';
import { authService } from '@/services/instances';

jest.mock('@/services/instances', () => ({ authService: { getNotices: jest.fn() } }));
jest.mock('expo-router', () => {
  const React = require('react');
  return { useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]) };
});

const svc = authService as jest.Mocked<typeof authService>;
const notice = (id: number, title: string, body: string) =>
  ({ id, title, body, area_id: null, createdAt: '2026-10-11T04:00:00.000Z' }) as any;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('notifications screen', () => {
  it('lists the notices from the server with title, body and date', async () => {
    svc.getNotices.mockResolvedValue([notice(2, 'Holiday', 'Closed on Friday'), notice(1, 'Menu change', 'New lunch menu')]);
    await render(<NotificationsScreen />);
    expect(await screen.findByText('Holiday')).toBeTruthy();
    expect(screen.getByText('Closed on Friday')).toBeTruthy();
    expect(screen.getByText('Menu change')).toBeTruthy();
    expect(screen.getAllByText('11 Oct 2026')).toHaveLength(2);
  });

  it('says so when there are no notices', async () => {
    svc.getNotices.mockResolvedValue([]);
    await render(<NotificationsScreen />);
    expect(await screen.findByText('No notifications yet.')).toBeTruthy();
  });

  it('shows an error with a retry that loads the list', async () => {
    svc.getNotices.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce([notice(1, 'Back online', 'x')]);
    await render(<NotificationsScreen />);
    fireEvent.press(await screen.findByText('Tap to retry'));
    expect(await screen.findByText('Back online')).toBeTruthy();
    expect(svc.getNotices).toHaveBeenCalledTimes(2);
  });
});
