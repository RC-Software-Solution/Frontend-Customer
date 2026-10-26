import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import VerifyScreen from '../auth/verify/verify.screen';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

const digit = (n: number) => screen.getByLabelText(`Digit ${n} of 4`);

describe('Verify screen', () => {
  it('shows the title, the subtitle and four digit boxes', async () => {
    await render(<VerifyScreen />);
    expect(screen.getByText('Verification Code')).toBeTruthy();
    expect(screen.getByText('We have sent the verification code to your email address')).toBeTruthy();
    for (const n of [1, 2, 3, 4]) expect(digit(n)).toBeTruthy();
  });

  it('keeps one digit per box', async () => {
    await render(<VerifyScreen />);
    await fireEvent.changeText(digit(1), '7');
    await fireEvent.changeText(digit(3), '2');
    expect(digit(1).props.value).toBe('7');
    expect(digit(2).props.value).toBe('');
    expect(digit(3).props.value).toBe('2');
    expect(digit(1).props.maxLength).toBe(1);
  });

  it('moves focus to the next box after a digit', async () => {
    await render(<VerifyScreen />);
    // the Jest TextInput mock is a class whose focus() lives on the prototype
    const focus = jest.spyOn(TextInput.prototype, 'focus');
    await fireEvent.changeText(digit(1), '7');
    expect(focus).toHaveBeenCalledTimes(1);
    await fireEvent.changeText(digit(2), '');
    expect(focus).toHaveBeenCalledTimes(2);
  });

  it('centres each digit: equal left and right padding, centred text', async () => {
    await render(<VerifyScreen />);
    for (const n of [1, 2, 3, 4]) {
      const s = StyleSheet.flatten(digit(n).props.style);
      expect(s.textAlign).toBe('center');
      expect(s.paddingLeft ?? s.paddingHorizontal).toBe(s.paddingRight ?? s.paddingHorizontal);
    }
  });

  it('Submit does nothing and Sign In opens the login screen', async () => {
    await render(<VerifyScreen />);
    await fireEvent.press(screen.getByText('Submit'));
    expect(router.push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Sign In'));
    expect(router.push).toHaveBeenCalledWith('/(routes)/login');
  });
});
