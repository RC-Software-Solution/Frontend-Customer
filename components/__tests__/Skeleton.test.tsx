import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { CardSkeleton, Skeleton } from '../ui/Skeleton';
import { color, radius } from '@/theme';

// the bars sit inside a group hidden from accessibility, so queries that look inside it must say so
const inside = { includeHiddenElements: true };

test('the group is announced once as "Loading" and its bars are hidden from accessibility', async () => {
  await render(<CardSkeleton />);
  const group = screen.getByLabelText('Loading');
  expect(group.props.accessibilityRole).toBe('progressbar');
  expect(screen.queryAllByTestId('skeleton-bar')).toHaveLength(0); // hidden from the accessibility tree
  expect(screen.getAllByTestId('skeleton-bar', inside).length).toBeGreaterThan(0);
});

test('count renders that many cards', async () => {
  await render(<CardSkeleton count={3} />);
  expect(screen.getAllByTestId('card-skeleton', inside)).toHaveLength(3);
  expect(screen.getAllByLabelText('Loading')).toHaveLength(1);
});

test('every bar is the field grey, and a card is a white Card', async () => {
  await render(<CardSkeleton />);
  const bars = screen.getAllByTestId('skeleton-bar', inside);
  expect(bars).toHaveLength(7); // the board draws seven bars per card
  bars.forEach((bar) => expect(StyleSheet.flatten(bar.props.style).backgroundColor).toBe(color.field));
  const card = StyleSheet.flatten(screen.getByTestId('card-skeleton', inside).props.style);
  expect(card.backgroundColor).toBe(color.surface);
  expect(card.borderRadius).toBe(radius.lg);
  expect(card.elevation).toBe(0); // an Android shadow under the half-transparent card would show through as a grey frame
});

test('Skeleton takes its size and radius from props', async () => {
  await render(<Skeleton width={110} height={18} radius={radius.md} />);
  expect(StyleSheet.flatten(screen.getByTestId('skeleton-bar', inside).props.style)).toMatchObject({ width: 110, height: 18, borderRadius: radius.md });
});
