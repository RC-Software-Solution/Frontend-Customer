import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { StatusChip } from '../ui/StatusChip';
import { status } from '@/theme';

test.each([
  ['pending', 'Pending'],
  ['preparing', 'Preparing'],
  ['delivering', 'On the way'],
  ['delivered', 'Delivered'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['delivery_failed', 'Delivery failed'],
])('%s shows "%s" in its own colours', async (value, label) => {
  await render(<StatusChip value={value} />);
  const style = StyleSheet.flatten(screen.getByText(label).props.style);
  expect(style.color).toBe(status[value as keyof typeof status].fg);
});

test('an unknown status from the server shows its raw text on a neutral chip', async () => {
  await render(<StatusChip value="on_hold" />);
  const style = StyleSheet.flatten(screen.getByText('on_hold').props.style);
  expect(style.color).toBe(status.cancelled.fg);
});
