import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import SignUpScreen from '../auth/signUp/signUp.screen';
import SignUpSecondScreen from '../auth/signUpSecond/signUpSecond.screen';
import { authService } from '@/services';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/services', () => ({ authService: { signup: jest.fn() } }));
jest.mock('@/services/push/push.service', () => ({ getFcmToken: jest.fn(async () => 'fcm-123') }));

const signup = authService.signup as jest.Mock;
const params = useLocalSearchParams as jest.Mock;
const alertMock = jest.fn();
(globalThis as any).alert = alertMock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('Sign-up step 1', () => {
  const fill = async (v: { name?: string; email?: string; phone?: string; location?: string }) => {
    if (v.name !== undefined) await fireEvent.changeText(screen.getByPlaceholderText('Full Name'), v.name);
    if (v.email !== undefined) await fireEvent.changeText(screen.getByPlaceholderText('Email'), v.email);
    if (v.phone !== undefined) await fireEvent.changeText(screen.getByPlaceholderText('Phone Number'), v.phone);
    if (v.location !== undefined) await fireEvent.changeText(screen.getByPlaceholderText('Location'), v.location);
  };
  const next = () => fireEvent.press(screen.getByText('Next'));
  const good = { name: 'Ann', email: 'ann@example.com', phone: '0771234567', location: 'Colombo' };

  it('shows the four required messages on an empty Next and goes nowhere', async () => {
    await render(<SignUpScreen />);
    await next();
    expect(await screen.findByText('Name is required')).toBeTruthy();
    expect(screen.getByText('Valid email is required')).toBeTruthy();
    expect(screen.getByText('Phone number must be 10 digits')).toBeTruthy();
    expect(screen.getByText('Location is required')).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    await render(<SignUpScreen />);
    await fill({ ...good, email: 'abc' });
    await next();
    expect(await screen.findByText('Valid email is required')).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('rejects a phone number that is not 10 digits', async () => {
    await render(<SignUpScreen />);
    await fill({ ...good, phone: '12345' });
    await next();
    expect(await screen.findByText('Phone number must be 10 digits')).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('opens step 2 with exactly the four typed values', async () => {
    await render(<SignUpScreen />);
    await fill(good);
    await next();
    expect(router.push).toHaveBeenCalledWith({ pathname: '/sign-up/signUpSecond', params: good });
  });

  it('Sign In in the footer opens the login screen', async () => {
    await render(<SignUpScreen />);
    await fireEvent.press(screen.getByText('Sign In'));
    expect(router.push).toHaveBeenCalledWith('/(routes)/login');
  });

  it('shows the title and the step eyebrow and has no back control', async () => {
    await render(<SignUpScreen />);
    expect(screen.getByText('Sign Up')).toBeTruthy();
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
    expect(screen.queryByLabelText('Go back')).toBeNull();
  });
});

describe('Sign-up step 2', () => {
  const prev = { name: 'Ann', email: 'ann@example.com', phone: '0771234567', location: 'Colombo' };
  const type = async (pw: string, confirm: string) => {
    await fireEvent.changeText(screen.getByPlaceholderText('Password'), pw);
    await fireEvent.changeText(screen.getByPlaceholderText('Confirm Password'), confirm);
  };
  const submit = () => fireEvent.press(screen.getByText('Create account'));
  beforeEach(() => params.mockReturnValue(prev));

  it('refuses a weak password', async () => {
    await render(<SignUpSecondScreen />);
    await type('weak', 'weak');
    await submit();
    expect(await screen.findByText('Password must be at least 8 characters, contain a number and a special character')).toBeTruthy();
    expect(signup).not.toHaveBeenCalled();
  });

  it('refuses a mismatch', async () => {
    await render(<SignUpSecondScreen />);
    await type('Passw0rd!', 'Passw0rd?');
    await submit();
    expect(await screen.findByText('Passwords do not match')).toBeTruthy();
    expect(signup).not.toHaveBeenCalled();
  });

  it('signs up with the step 1 values and the device token, then goes to login', async () => {
    signup.mockResolvedValue({});
    await render(<SignUpSecondScreen />);
    await type('Passw0rd!', 'Passw0rd!');
    await act(async () => submit());
    await waitFor(() =>
      expect(signup).toHaveBeenCalledWith({
        full_name: 'Ann',
        email: 'ann@example.com',
        password: 'Passw0rd!',
        role: 'customer',
        address: 'Colombo',
        phone: '0771234567',
        fcm_token: 'fcm-123',
      }),
    );
    expect(alertMock).toHaveBeenCalledWith('Signup successful! Please log in.');
    expect(router.replace).toHaveBeenCalledWith('/(routes)/login');
  });

  it('alerts the server message when sign-up fails', async () => {
    signup.mockRejectedValue(new Error('Email already registered'));
    await render(<SignUpSecondScreen />);
    await type('Passw0rd!', 'Passw0rd!');
    await act(async () => submit());
    await waitFor(() => expect(alertMock).toHaveBeenCalledWith('Email already registered'));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('shows the step eyebrow, a 48dp Go back that returns, and Create account', async () => {
    await render(<SignUpSecondScreen />);
    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    expect(screen.queryByText(/complete sign ?up/i)).toBeNull();
    const back = screen.getByLabelText('Go back');
    const s = StyleSheet.flatten(back.props.style);
    expect(s.width).toBeGreaterThanOrEqual(48);
    expect(s.height).toBeGreaterThanOrEqual(48);
    await fireEvent.press(back);
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
