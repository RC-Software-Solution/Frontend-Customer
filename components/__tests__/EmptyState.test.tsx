import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState } from '../ui/EmptyState';

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
