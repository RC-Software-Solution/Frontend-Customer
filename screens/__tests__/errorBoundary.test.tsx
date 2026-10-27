import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ErrorBoundary } from '@/app/_layout';
import { TokenUtils } from '@/services/utils/token.utils';

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));

describe('root ErrorBoundary', () => {
  it('offers Try again, which only retries', async () => {
    const retry = jest.fn(async () => {});
    const clear = jest.spyOn(TokenUtils, 'clearTokens');
    await render(<ErrorBoundary error={new Error('boom')} retry={retry} />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(clear).not.toHaveBeenCalled();
  });

  it('offers Sign out, which clears the saved session before retrying', async () => {
    const retry = jest.fn(async () => {});
    const clear = jest.spyOn(TokenUtils, 'clearTokens');
    await render(<ErrorBoundary error={new Error('boom')} retry={retry} />);
    await fireEvent.press(screen.getByText('Sign out'));
    await waitFor(() => expect(retry).toHaveBeenCalledTimes(1));
    expect(clear).toHaveBeenCalled();
  });
});
