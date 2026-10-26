import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState } from '../ui/EmptyState';
import { color, status } from '@/theme';

test('shows the title and message', async () => {
  await render(<EmptyState icon="receipt-outline" title="No orders yet" message="Your orders appear here" />);
  expect(screen.getByText('No orders yet')).toBeTruthy();
  expect(screen.getByText('Your orders appear here')).toBeTruthy();
});

test('renders the action only when both label and handler are given, and calls it', async () => {
  const onAction = jest.fn();
  await render(<EmptyState icon="refresh" title="Could not load" actionLabel="Try again" onAction={onAction} />);
  fireEvent.press(screen.getByText('Try again'));
  expect(onAction).toHaveBeenCalledTimes(1);
});

test('has no button without an action', async () => {
  await render(<EmptyState icon="refresh" title="Nothing here" />);
  expect(screen.queryByRole('button')).toBeNull();
});

test('the error tone paints the disc and icon in the delivery-failed colours; the default stays brand', async () => {
  const { unmount } = await render(<EmptyState icon="refresh" title="Could not load" tone="error" />);
  expect(StyleSheet.flatten(screen.getByTestId('empty-disc').props.style).backgroundColor).toBe(status.delivery_failed.bg);
  expect(JSON.stringify(screen.toJSON())).toContain(status.delivery_failed.fg);
  await unmount();
  await render(<EmptyState icon="refresh" title="Nothing here" />);
  expect(StyleSheet.flatten(screen.getByTestId('empty-disc').props.style).backgroundColor).toBe(color.brandSoft);
  expect(JSON.stringify(screen.toJSON())).toContain(color.brandStrong);
});
