import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ErrorState } from '../ui/ErrorState';

test('actionLabel replaces the default button text', async () => {
  await render(<ErrorState title="Couldn't load" error={{ status: 0 }} onRetry={jest.fn()} actionLabel="Reload" />);
  expect(screen.getByText('Reload')).toBeTruthy();
  expect(screen.queryByText('Try again')).toBeNull();
});
