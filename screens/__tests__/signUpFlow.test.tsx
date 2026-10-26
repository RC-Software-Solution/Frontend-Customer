import React from 'react';
import { Stack } from 'expo-router';
import { renderRouter, screen, fireEvent } from 'expo-router/testing-library';
import SignUpScreen from '../auth/signUp/signUp.screen';
import SignUpSecondScreen from '../auth/signUpSecond/signUpSecond.screen';

jest.mock('@/services/instances', () => ({
  authService: { signup: jest.fn() },
  orderService: {},
  menuService: {},
}));
jest.mock('@/services/push/push.service', () => ({ getFcmToken: jest.fn(async () => 'fcm-123') }));

const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  '(routes)/sign-up/index': SignUpScreen,
  '(routes)/sign-up/signUpSecond': SignUpSecondScreen,
};

it('Next then Go back keeps what was typed on step 1', async () => {
  await renderRouter(routes, { initialUrl: '/sign-up' });
  await fireEvent.changeText(await screen.findByPlaceholderText('Full Name'), 'Ann');
  await fireEvent.changeText(screen.getByPlaceholderText('Email'), 'ann@example.com');
  await fireEvent.changeText(screen.getByPlaceholderText('Phone Number'), '0771234567');
  await fireEvent.changeText(screen.getByPlaceholderText('Location'), 'Colombo');
  await fireEvent.press(screen.getByText('Next'));

  expect(await screen.findByText('Step 2 of 2')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Go back'));

  expect(await screen.findByText('Step 1 of 2')).toBeTruthy();
  expect(screen.getByPlaceholderText('Full Name').props.value).toBe('Ann');
  expect(screen.getByPlaceholderText('Email').props.value).toBe('ann@example.com');
  expect(screen.getByPlaceholderText('Phone Number').props.value).toBe('0771234567');
  expect(screen.getByPlaceholderText('Location').props.value).toBe('Colombo');
});
