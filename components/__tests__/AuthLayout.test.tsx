import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AuthBanner, AuthFooterLink, AuthLayout } from '../ui/AuthLayout';
import { color } from '@/theme';

const flat = (el: any) => StyleSheet.flatten(el.props.style);

test('renders title, subtitle and children', async () => {
  await render(
    <AuthLayout title="Sign In" subtitle="Welcome back">
      <Text>child</Text>
    </AuthLayout>,
  );
  expect(screen.getByText('Sign In')).toBeTruthy();
  expect(screen.getByText('Welcome back')).toBeTruthy();
  expect(screen.getByText('child')).toBeTruthy();
});

test('no Go back without onBack; with it a 48dp target that calls onBack', async () => {
  const { rerender } = await render(<AuthLayout title="T"><Text>c</Text></AuthLayout>);
  expect(screen.queryByLabelText('Go back')).toBeNull();
  const onBack = jest.fn();
  await rerender(<AuthLayout title="T" onBack={onBack}><Text>c</Text></AuthLayout>);
  const back = screen.getByLabelText('Go back');
  const s = flat(back);
  expect(s.width).toBeGreaterThanOrEqual(48);
  expect(s.height).toBeGreaterThanOrEqual(48);
  await fireEvent.press(back);
  expect(onBack).toHaveBeenCalledTimes(1);
});

test('hero is 16:9 with exactly one scrim and the brand lines', async () => {
  await render(<AuthLayout title="T"><Text>c</Text></AuthLayout>);
  expect(flat(screen.getByTestId('auth-hero')).aspectRatio).toBeCloseTo(16 / 9);
  expect(screen.getAllByTestId('auth-hero-scrim')).toHaveLength(1);
  expect(flat(screen.getByTestId('auth-hero-scrim'))).toMatchObject({ position: 'absolute', backgroundColor: color.scrim });
  expect(screen.getByText('RC Caterings')).toBeTruthy();
  expect(screen.getByText('Fresh home-style meals, delivered')).toBeTruthy();
});

test('AuthBanner is an alert showing its message', async () => {
  await render(<AuthBanner message="x" />);
  const alert = screen.getByRole('alert');
  expect(alert.props.accessibilityRole).toBe('alert');
  expect(screen.getByText('x')).toBeTruthy();
});

test('AuthFooterLink shows both texts and the action is a 48dp button', async () => {
  const fn = jest.fn();
  await render(<AuthFooterLink prompt="Don't have an account?" action="Sign Up" onPress={fn} />);
  expect(screen.getByText("Don't have an account?")).toBeTruthy();
  const action = screen.getByRole('button', { name: 'Sign Up' });
  expect(flat(action).minHeight).toBeGreaterThanOrEqual(48);
  await fireEvent.press(screen.getByText('Sign Up'));
  expect(fn).toHaveBeenCalledTimes(1);
});
