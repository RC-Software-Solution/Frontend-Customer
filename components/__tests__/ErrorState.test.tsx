import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ErrorState } from '../ui/ErrorState';

const OFFLINE = { status: 0, code: 'NETWORK_ERROR' };

test('an offline failure shows the title, the offline sentence and a retry button that calls back', async () => {
  const onRetry = jest.fn();
  await render(<ErrorState title="Couldn't load your orders" error={OFFLINE} onRetry={onRetry} />);
  expect(screen.getByText("Couldn't load your orders")).toBeTruthy();
  expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
  fireEvent.press(screen.getByText('Try again'));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test.each([
  ['a server error', { status: 500 }],
  ['a plain Error', new Error('x')],
  ['no error at all', undefined],
])('%s shows the generic sentence', async (_name, error) => {
  await render(<ErrorState title="Couldn't load" error={error} onRetry={jest.fn()} />);
  expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy();
  expect(screen.queryByText('Check your connection and try again.')).toBeNull();
});

test('actionLabel overrides the button text', async () => {
  await render(<ErrorState title="Couldn't load" error={OFFLINE} onRetry={jest.fn()} actionLabel="Try again" />);
  expect(screen.getByText('Try again')).toBeTruthy();
  expect(screen.queryByText('Tap to retry')).toBeNull();
});
