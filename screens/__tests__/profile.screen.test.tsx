import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Profile from '../profile/profile.screen';
import { AuthProvider } from '@/services';
import { authService } from '@/services/instances';

jest.mock('@/services/instances', () => ({
  authService: {
    isAuthenticated: jest.fn(),
    getRefreshToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    deleteAccount: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  },
  orderService: {},
  menuService: {},
}));
jest.mock('expo-router', () => {
  const React = require('react');
  return { router: { push: jest.fn(), replace: jest.fn() }, useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]) };
});

const auth = authService as jest.Mocked<typeof authService>;
const me = { id: 'u1', full_name: 'Nimal Perera', email: 'nimal@test.local', address: '12 Galle Road', phone: '0771234567', role: 'customer' } as any;
let alert: jest.SpyInstance;

const mount = async () => {
  await render(
    <AuthProvider>
      <Profile />
    </AuthProvider>,
  );
  await screen.findByText('nimal@test.local', { exact: false }).catch(() => {});
  await screen.findByText('nimal@test.local');
};
const openEdit = async () => fireEvent.press(screen.getByText('Edit Profile'));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  auth.isAuthenticated.mockResolvedValue(true);
  auth.getRefreshToken.mockResolvedValue(null);
  auth.getCurrentUser.mockResolvedValue(me);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('profile view', () => {
  it('shows the details read-only, with Edit Profile and Change Password available', async () => {
    await mount();
    expect(screen.getByText('12 Galle Road')).toBeTruthy();
    expect(screen.getByText('0771234567')).toBeTruthy();
    expect(screen.getByText('Edit Profile')).toBeTruthy();
    expect(screen.getByText('Change Password')).toBeTruthy();
  });
});

describe('editing the profile', () => {
  it('opens a form filled with the current name, location and phone (email stays out of it)', async () => {
    await mount();
    await openEdit();
    expect(screen.getByDisplayValue('Nimal Perera')).toBeTruthy();
    expect(screen.getByDisplayValue('12 Galle Road')).toBeTruthy();
    expect(screen.getByDisplayValue('0771234567')).toBeTruthy();
    expect(screen.queryByDisplayValue('nimal@test.local')).toBeNull();
  });

  it('saves trimmed values, then shows the new details', async () => {
    const updated = { ...me, full_name: 'Nimal P', phone: '0779998888' };
    auth.updateProfile.mockResolvedValue(updated);
    await mount();
    await openEdit();
    await fireEvent.changeText(screen.getByDisplayValue('Nimal Perera'), '  Nimal P ');
    await fireEvent.changeText(screen.getByDisplayValue('0771234567'), ' 0779998888 ');
    await fireEvent.press(screen.getByText('Save changes'));

    await waitFor(() => expect(auth.updateProfile).toHaveBeenCalledWith({ full_name: 'Nimal P', address: '12 Galle Road', phone: '0779998888' }));
    expect(alert).toHaveBeenCalledWith('Profile updated', expect.any(String));
    // back on the profile view with the saved values
    expect(await screen.findByText('Nimal P')).toBeTruthy();
    expect(screen.getByText('0779998888')).toBeTruthy();
    expect(screen.queryByText('Save changes')).toBeNull();
  });

  it('explains what is wrong and does not call the server', async () => {
    await mount();
    await openEdit();
    await fireEvent.changeText(screen.getByDisplayValue('Nimal Perera'), 'A');
    await fireEvent.changeText(screen.getByDisplayValue('0771234567'), 'abc');
    await fireEvent.press(screen.getByText('Save changes'));

    expect(await screen.findByText(/at least 2 characters/)).toBeTruthy();
    expect(screen.getByText(/valid phone number/i)).toBeTruthy();
    expect(auth.updateProfile).not.toHaveBeenCalled();
  });

  it('shows a server error and stays in the form with the typed values', async () => {
    auth.updateProfile.mockRejectedValue(new Error('Network error - please check your connection'));
    await mount();
    await openEdit();
    await fireEvent.changeText(screen.getByDisplayValue('Nimal Perera'), 'Nimal Q');
    await fireEvent.press(screen.getByText('Save changes'));

    expect(await screen.findByText(/network error/i)).toBeTruthy();
    expect(screen.getByDisplayValue('Nimal Q')).toBeTruthy();
  });

  it('Cancel leaves without saving', async () => {
    await mount();
    await openEdit();
    await fireEvent.changeText(screen.getByDisplayValue('Nimal Perera'), 'Changed');
    await fireEvent.press(screen.getByText('Cancel'));
    expect(auth.updateProfile).not.toHaveBeenCalled();
    expect(screen.getByText('Edit Profile')).toBeTruthy();
    expect(screen.queryByDisplayValue('Changed')).toBeNull();
  });
});

describe('changing the password', () => {
  const open = async () => fireEvent.press(screen.getByText('Change Password'));
  const fill = async (current: string, next: string, confirm = next) => {
    await fireEvent.changeText(screen.getByPlaceholderText('Your current password'), current);
    await fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), next);
    await fireEvent.changeText(screen.getByPlaceholderText('Repeat the new password'), confirm);
  };
  const submit = async () => fireEvent.press(screen.getByText('Change password', { exact: true }));

  it('opens a form asking for the current and the new password', async () => {
    await mount();
    await open();
    expect(screen.getByText('Current password')).toBeTruthy();
    expect(screen.getByText('New password')).toBeTruthy();
    expect(screen.getByText('Confirm new password')).toBeTruthy();
  });

  it('changes the password and confirms', async () => {
    auth.changePassword.mockResolvedValue(undefined);
    await mount();
    await open();
    await fill('old-pass', 'Brand-new-1');
    await submit();

    await waitFor(() => expect(auth.changePassword).toHaveBeenCalledWith('old-pass', 'Brand-new-1'));
    expect(alert).toHaveBeenCalledWith('Password changed', expect.stringMatching(/other devices/i));
  });

  it('refuses a mismatch, a too-short password and reusing the current one', async () => {
    await mount();
    await open();
    await fill('old-pass', 'Brand-new-1', 'Different-2');
    await submit();
    expect(await screen.findByText('Passwords do not match')).toBeTruthy();

    await fill('old-pass', '123');
    await submit();
    expect(await screen.findByText('Password must be at least 6 characters')).toBeTruthy();

    await fill('old-pass', 'old-pass');
    await submit();
    expect(await screen.findByText(/different password/i)).toBeTruthy();
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it('shows "Current password is incorrect" from the server and does not confirm', async () => {
    auth.changePassword.mockRejectedValue(new Error('Current password is incorrect'));
    await mount();
    await open();
    await fill('wrong', 'Brand-new-1');
    await submit();
    expect(await screen.findByText('Current password is incorrect')).toBeTruthy();
    expect(alert).not.toHaveBeenCalledWith('Password changed', expect.anything());
  });
});

describe('deleting the account', () => {
  const openDelete = async () => fireEvent.press(screen.getByText('Delete Account'));

  it('asks the user to type DELETE before the account can be deleted', async () => {
    await mount();
    await openDelete();
    expect(screen.getByText('Type DELETE to confirm')).toBeTruthy();
    expect(screen.getByLabelText('Type DELETE to confirm')).toBeTruthy();
    expect(screen.getByText('This permanently deletes your account and cannot be undone.')).toBeTruthy();
  });

  it('does not delete when "Yes, Delete" is pressed without typing', async () => {
    await mount();
    await openDelete();
    await fireEvent.press(screen.getByText('Yes, Delete'));
    expect(auth.deleteAccount).not.toHaveBeenCalled();
  });

  it('deletes once after DELETE is typed', async () => {
    auth.deleteAccount.mockResolvedValue(undefined);
    await mount();
    await openDelete();
    await fireEvent.changeText(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    await fireEvent.press(screen.getByText('Yes, Delete'));
    await waitFor(() => expect(auth.deleteAccount).toHaveBeenCalledTimes(1));
  });
});
