import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import WelcomeIntroScreen from '../welcome/welcome.intro';
import { color } from '@/theme';

const mockMarkIntroSeen = jest.fn();
jest.mock('@/services', () => ({ useAuth: () => ({ markIntroSeen: mockMarkIntroSeen }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('Welcome intro screen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the first slide and a Next button at once', async () => {
    await render(<WelcomeIntroScreen />);
    expect(screen.getAllByText('RC Caterings').length).toBeGreaterThan(0);
    expect(screen.getByText('Welcome')).toBeTruthy();
    expect(
      screen.getByText('It’s a pleasure to meet you. We are excited that you’re here so let’s get started!'),
    ).toBeTruthy();
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('sets the slide head and title in Nunito bold', async () => {
    await render(<WelcomeIntroScreen />);
    expect(StyleSheet.flatten(screen.getAllByText('RC Caterings')[0].props.style).fontFamily).toBe('Nunito_700Bold');
    expect(StyleSheet.flatten(screen.getByText('Welcome').props.style).fontFamily).toBe('Nunito_700Bold');
  });

  it('reaches Done after two Next presses and Done marks the intro seen and opens sign-up', async () => {
    await render(<WelcomeIntroScreen />);
    await fireEvent.press(screen.getByText('Next'));
    await fireEvent.press(screen.getByText('Next'));
    await fireEvent.press(screen.getByText('Done'));
    expect(mockMarkIntroSeen).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/sign-up');
  });

  it('draws the Next and Done labels in the dark on-brand ink, not white on the green fill', async () => {
    await render(<WelcomeIntroScreen />);
    expect(StyleSheet.flatten(screen.getByText('Next').props.style).color).toBe(color.onBrand);
    await fireEvent.press(screen.getByText('Next'));
    await fireEvent.press(screen.getByText('Next'));
    expect(StyleSheet.flatten(screen.getByText('Done').props.style).color).toBe(color.onBrand);
  });
});
