import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ForgotPasswordScreen from '../auth/forgotPassword/forgotPassword.screen';
import ResetPasswordScreen from '../auth/resetPassword/resetPassword.screen';
import { authService } from '@/services/instances';

jest.mock('@/services/instances', () => ({
  authService: { forgotPassword: jest.fn(), resetPassword: jest.fn() },
  orderService: {},
  menuService: {},
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

const auth = authService as jest.Mocked<typeof authService>;
const params = useLocalSearchParams as jest.Mock;
let alert: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Forgot password screen', () => {
  const type = async (email: string) => fireEvent.changeText(screen.getByPlaceholderText('example@gmail.com'), email);
  const send = async () => fireEvent.press(screen.getByText('Send code'));

  it('refuses an invalid email without calling the server', async () => {
    await render(<ForgotPasswordScreen />);
    await type('not-an-email');
    await send();
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(auth.forgotPassword).not.toHaveBeenCalled();
  });

  it('asks for a code for the cleaned-up email and moves on to the reset screen', async () => {
    auth.forgotPassword.mockResolvedValue(undefined);
    await render(<ForgotPasswordScreen />);
    await type('  Ann@Example.COM ');
    await send();

    await waitFor(() => expect(auth.forgotPassword).toHaveBeenCalledWith('ann@example.com'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/(routes)/login/reset-password', params: { email: 'ann@example.com' } });
  });

  it('shows the server problem and stays on the screen', async () => {
    auth.forgotPassword.mockRejectedValue(new Error('Too many password reset requests. Please try again later.'));
    await render(<ForgotPasswordScreen />);
    await type('ann@example.com');
    await send();
    expect(await screen.findByText(/too many password reset requests/i)).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('can go back to sign in, from the link or the back arrow', async () => {
    await render(<ForgotPasswordScreen />);
    await fireEvent.press(screen.getByText('Back to sign in'));
    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(router.back).toHaveBeenCalledTimes(2);
  });
});

describe('Reset password screen', () => {
  beforeEach(() => params.mockReturnValue({ email: 'ann@example.com' }));

  const fill = async (code: string, password: string, confirm = password) => {
    await fireEvent.changeText(screen.getByPlaceholderText('123456'), code);
    await fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), password);
    await fireEvent.changeText(screen.getByPlaceholderText('Repeat the password'), confirm);
  };
  const submit = async () => fireEvent.press(screen.getByText('Reset password', { exact: true }));

  it('says which email it is for, without promising an email was sent (unknown emails look identical)', async () => {
    await render(<ResetPasswordScreen />);
    const text = screen.getByText(/ann@example\.com/).props.children as string;
    expect(text).toMatch(/If there is an account/i);
    expect(text).not.toMatch(/we sent/i);
    expect(text).toMatch(/spam/i);
  });

  it('only accepts digits in the code box', async () => {
    await render(<ResetPasswordScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText('123456'), 'ab12-34');
    expect(screen.getByPlaceholderText('123456').props.value).toBe('1234');
  });

  it('explains every problem and does not call the server when the form is wrong', async () => {
    await render(<ResetPasswordScreen />);
    await submit();
    expect(await screen.findByText('Enter the 6-digit code from your email')).toBeTruthy();
    expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('refuses mismatched passwords', async () => {
    await render(<ResetPasswordScreen />);
    await fill('123456', 'Brand-new-1', 'Different-2');
    await submit();
    expect(await screen.findByText('Passwords do not match')).toBeTruthy();
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('resets the password with the email, code and new password, then goes to sign in', async () => {
    auth.resetPassword.mockResolvedValue(undefined);
    await render(<ResetPasswordScreen />);
    await fill('123456', 'Brand-new-1');
    await submit();

    await waitFor(() => expect(auth.resetPassword).toHaveBeenCalledWith('ann@example.com', '123456', 'Brand-new-1'));
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Password updated', expect.any(String), expect.any(Array)));

    // pressing "Sign in" on the confirmation sends the user to the login screen
    const buttons = alert.mock.calls.find((c) => c[0] === 'Password updated')![2] as any[];
    buttons.find((b) => b.text === 'Sign in').onPress();
    // pops back to the existing login screen instead of stacking a second one
    expect(router.dismissTo).toHaveBeenCalledWith('/(routes)/login');
  });

  it('shows a wrong or expired code from the server and does not claim success', async () => {
    auth.resetPassword.mockRejectedValue(new Error('Invalid or expired code'));
    await render(<ResetPasswordScreen />);
    await fill('000000', 'Brand-new-1');
    await submit();
    expect(await screen.findByText('Invalid or expired code')).toBeTruthy();
    expect(alert).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('tells the user when they have used up their attempts', async () => {
    auth.resetPassword.mockRejectedValue(new Error('Too many attempts. Please request a new code.'));
    await render(<ResetPasswordScreen />);
    await fill('000000', 'Brand-new-1');
    await submit();
    expect(await screen.findByText(/too many attempts/i)).toBeTruthy();
  });

  it('lets the user ask for a new code only after a short wait', async () => {
    jest.useFakeTimers();
    auth.forgotPassword.mockResolvedValue(undefined);
    await render(<ResetPasswordScreen />);

    expect(screen.getByText('Send a new code in 30s')).toBeTruthy();
    await fireEvent.press(screen.getByText('Send a new code in 30s'));
    expect(auth.forgotPassword).not.toHaveBeenCalled(); // locked during the wait

    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000);
    });
    await fireEvent.press(await screen.findByText('Send a new code'));
    await waitFor(() => expect(auth.forgotPassword).toHaveBeenCalledWith('ann@example.com'));
    expect(alert).toHaveBeenCalledWith('Code sent', expect.any(String));
    expect(screen.getByText('Send a new code in 30s')).toBeTruthy(); // waiting again
  });

  it('has a back arrow, a way to change the email, and a way back to sign in', async () => {
    await render(<ResetPasswordScreen />);

    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(router.back).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByText('Wrong email? Use a different one'));
    expect(router.back).toHaveBeenCalledTimes(2);

    await fireEvent.press(screen.getByText('Back to sign in'));
    expect(router.dismissTo).toHaveBeenCalledWith('/(routes)/login');
  });

  it('without an email (opened directly) sends the user back to start', async () => {
    params.mockReturnValue({});
    await render(<ResetPasswordScreen />);
    expect(screen.getByText(/Start from "Forgot Password"/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Back'));
    expect(router.replace).toHaveBeenCalledWith('/(routes)/login/forgot-password');
  });
});
