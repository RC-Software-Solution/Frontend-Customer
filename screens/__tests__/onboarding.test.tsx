import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import Onboarding from '../onboarding/onboarding';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('Onboarding screen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the headline, the description and the button at once, with no spinner', async () => {
    await render(<Onboarding />);
    expect(screen.getByText('Crave. Order. Enjoy!')).toBeTruthy();
    expect(screen.getByText('Delicious meals, made with care and delivered fast.')).toBeTruthy();
    expect(screen.getByText('Get Started')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('sets the headline in Nunito bold', async () => {
    await render(<Onboarding />);
    expect(StyleSheet.flatten(screen.getByText('Crave. Order. Enjoy!').props.style).fontFamily).toBe('Nunito_700Bold');
  });

  it('opens the welcome intro from Get Started', async () => {
    await render(<Onboarding />);
    await fireEvent.press(screen.getByText('Get Started'));
    expect(router.push).toHaveBeenCalledWith('/(routes)/welcome-intro');
  });
});
