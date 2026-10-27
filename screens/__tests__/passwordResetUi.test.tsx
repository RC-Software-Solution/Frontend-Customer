import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ForgotPasswordScreen from '../auth/forgotPassword/forgotPassword.screen';
import ResetPasswordScreen from '../auth/resetPassword/resetPassword.screen';
import { authService } from '@/services/instances';
import { color } from '@/theme';

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
const style = (el: any) => StyleSheet.flatten(el.props.style) ?? {};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Forgot password screen: banner vs field error', () => {
  const type = async (email: string) => fireEvent.changeText(screen.getByPlaceholderText('example@gmail.com'), email);

  it('shows a server failure in the banner', async () => {
    auth.forgotPassword.mockRejectedValue(new Error('Too many password reset requests. Please try again later.'));
    await render(<ForgotPasswordScreen />);
    await type('ann@example.com');
    await fireEvent.press(screen.getByText('Send code'));
    expect(within(await screen.findByRole('alert')).getByText(/too many password reset requests/i)).toBeTruthy();
  });

  it('keeps an invalid email under the field, with no banner', async () => {
    await render(<ForgotPasswordScreen />);
    await type('not-an-email');
    await fireEvent.press(screen.getByText('Send code'));
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('typing clears the field error and a new send clears the banner', async () => {
    await render(<ForgotPasswordScreen />);
    await type('nope');
    await fireEvent.press(screen.getByText('Send code'));
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    await type('nop');
    expect(screen.queryByText('Enter a valid email address')).toBeNull();

    auth.forgotPassword.mockRejectedValue(new Error('Boom'));
    await type('ann@example.com');
    await fireEvent.press(screen.getByText('Send code'));
    expect(await screen.findByRole('alert')).toBeTruthy();
    auth.forgotPassword.mockReturnValue(new Promise(() => {}));
    await act(async () => {
      void fireEvent.press(screen.getByText('Send code'));
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('typing in the email field removes a failed-request banner', async () => {
    auth.forgotPassword.mockRejectedValue(new Error('Boom'));
    await render(<ForgotPasswordScreen />);
    await type('ann@example.com');
    await fireEvent.press(screen.getByText('Send code'));
    expect(await screen.findByRole('alert')).toBeTruthy();
    await type('ann@example.co');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Back to sign in is a 48dp row', async () => {
    await render(<ForgotPasswordScreen />);
    const link = screen.getByText('Back to sign in').parent!;
    expect(style(link).minHeight).toBeGreaterThanOrEqual(48);
  });
});

describe('Reset password screen: code box, links, banner', () => {
  beforeEach(() => params.mockReturnValue({ email: 'ann@example.com' }));

  const fill = async (code: string, password: string, confirm = password) => {
    await fireEvent.changeText(screen.getByPlaceholderText('123456'), code);
    await fireEvent.changeText(screen.getByPlaceholderText('8+ characters, a number and a symbol'), password);
    await fireEvent.changeText(screen.getByPlaceholderText('Repeat the password'), confirm);
  };
  const submit = async () => fireEvent.press(screen.getByText('Reset password', { exact: true }));

  it('the code box is numeric, six long, centred and spaced; its value stays raw digits', async () => {
    await render(<ResetPasswordScreen />);
    const box = screen.getByPlaceholderText('123456');
    expect(box.props.inputMode).toBe('numeric');
    expect(box.props.maxLength).toBe(6);
    expect(style(box).textAlign).toBe('center');
    expect(style(box).letterSpacing).toBeGreaterThan(0);

    await fireEvent.changeText(box, '12a3 45');
    expect(screen.getByPlaceholderText('123456').props.value).toBe('12345');
  });

  it('submits the raw six digits', async () => {
    auth.resetPassword.mockResolvedValue(undefined);
    await render(<ResetPasswordScreen />);
    await fill('123456', 'Brand-new-1');
    await submit();
    await waitFor(() => expect(auth.resetPassword).toHaveBeenCalledWith('ann@example.com', '123456', 'Brand-new-1'));
  });

  it('the resend timer is muted without an opacity fade, then brand once ready', async () => {
    jest.useFakeTimers();
    await render(<ResetPasswordScreen />);
    const waiting = screen.getByText('Send a new code in 30s');
    expect(style(waiting).color).toBe(color.muted);
    expect(style(waiting.parent!).opacity ?? 1).toBe(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000);
    });
    expect(style(await screen.findByText('Send a new code')).color).toBe(color.brandStrong);
  });

  it('Wrong email? is an underlined brand link with a 48dp touch area', async () => {
    await render(<ResetPasswordScreen />);
    const text = screen.getByText('Wrong email? Use a different one');
    expect(style(text).color).toBe(color.brandStrong);
    expect(style(text).textDecorationLine).toBe('underline');
    expect(style(text.parent!).minHeight).toBeGreaterThanOrEqual(48);
  });

  it('every link row is at least 48dp', async () => {
    await render(<ResetPasswordScreen />);
    for (const label of ['Send a new code in 30s', 'Back to sign in']) {
      expect(style(screen.getByText(label).parent!).minHeight).toBeGreaterThanOrEqual(48);
    }
  });

  it('shows a server failure in the banner', async () => {
    auth.resetPassword.mockRejectedValue(new Error('Invalid or expired code'));
    await render(<ResetPasswordScreen />);
    await fill('000000', 'Brand-new-1');
    await submit();
    expect(within(await screen.findByRole('alert')).getByText('Invalid or expired code')).toBeTruthy();
  });

  it('keeps field problems under their fields, with no banner', async () => {
    await render(<ResetPasswordScreen />);
    await submit();
    expect(await screen.findByText('Enter the 6-digit code from your email')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();

    await fill('123456', 'Brand-new-1', 'Different-2');
    await submit();
    expect(await screen.findByText('Passwords do not match')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
