import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import TabBarButton from '../tabBarButton/tabBarButton';
import { ThemeProvider, DefaultTheme } from 'expo-router/react-navigation';
import { color } from '@/theme';

// PlatformPressable reads the navigation theme.
const renderBtn = (ui: React.ReactElement) => render(<ThemeProvider value={DefaultTheme}>{ui}</ThemeProvider>);

const base = { onPress: jest.fn(), onLongPress: jest.fn(), routeName: 'index', label: 'Home' };

test('the label is visible whether the tab is focused or not', async () => {
  const first = await renderBtn(<TabBarButton {...base} isFocused />);
  expect(screen.getByText('Home')).toBeVisible();
  await first.unmount();
  await renderBtn(<TabBarButton {...base} isFocused={false} />);
  expect(screen.getByText('Home')).toBeVisible();
});

test('only the focused tab is selected, and it is a labelled button', async () => {
  const first = await renderBtn(<TabBarButton {...base} isFocused />);
  const btn = screen.getByRole('button', { name: 'Home' });
  expect(btn.props.accessibilityState).toMatchObject({ selected: true });
  expect(StyleSheet.flatten(btn.props.style).minHeight).toBeGreaterThanOrEqual(56);
  await first.unmount();
  await renderBtn(<TabBarButton {...base} isFocused={false} />);
  expect(screen.getByRole('button', { name: 'Home' }).props.accessibilityState).toMatchObject({
    selected: false,
  });
});

// the badge is hidden from screen readers; the button's own label carries the true count instead
const hidden = { includeHiddenElements: true };

test('badge shows the count and caps at 9+, but the button label keeps the true count', async () => {
  const first = await renderBtn(<TabBarButton {...base} isFocused={false} badge={3} />);
  expect(screen.getByText('3', hidden)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Home, 3 unread' })).toBeOnTheScreen();
  await first.unmount();
  await renderBtn(<TabBarButton {...base} isFocused={false} badge={12} />);
  expect(screen.getByText('9+', hidden)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Home, 12 unread' })).toBeOnTheScreen();
});

test('no badge, and a plain label, when the count is 0', async () => {
  await renderBtn(<TabBarButton {...base} isFocused={false} badge={0} />);
  expect(screen.getByRole('button', { name: 'Home' })).toBeOnTheScreen();
  expect(screen.queryByText('0', hidden)).toBeNull();
  expect(screen.queryByLabelText(/unread/, hidden)).toBeNull();
});

test('label colour: onBrand when focused, muted otherwise', async () => {
  const { unmount } = await renderBtn(<TabBarButton {...base} isFocused />);
  expect(StyleSheet.flatten(screen.getByText('Home').props.style).color).toBe(color.onBrand);
  await unmount();
  await renderBtn(<TabBarButton {...base} isFocused={false} />);
  expect(StyleSheet.flatten(screen.getByText('Home').props.style).color).toBe(color.muted);
});
