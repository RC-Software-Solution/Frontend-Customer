import React from 'react';
import { Keyboard, ScrollView, StyleSheet, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { KeyboardForm } from '../ui/KeyboardForm';

describe('KeyboardForm', () => {
  let listeners: Record<string, () => void>;
  let scrollToEnd: jest.SpyInstance;
  let removed: jest.Mock;

  beforeEach(() => {
    listeners = {};
    removed = jest.fn();
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, cb: () => void) => {
      listeners[event] = cb;
      return { remove: removed };
    }) as any);
    scrollToEnd = jest.spyOn(ScrollView.prototype as any, 'scrollToEnd').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('renders its children', async () => {
    await render(
      <KeyboardForm>
        <Text>form content</Text>
      </KeyboardForm>,
    );
    expect(screen.getByText('form content')).toBeTruthy();
  });

  it('makes room for the keyboard on every platform, not just iOS (Android is edge-to-edge)', async () => {
    await render(
      <KeyboardForm>
        <Text>x</Text>
      </KeyboardForm>,
    );
    // behavior="padding" is what puts a paddingBottom (the keyboard's height) on the container;
    // without it (the old iOS-only setting) Android had no such style and the keyboard covered the form
    const container = screen.toJSON() as any;
    expect(StyleSheet.flatten(container.props.style)).toHaveProperty('paddingBottom');
  });

  it('scrolls to the bottom when the keyboard opens so the action button stays visible', async () => {
    await render(
      <KeyboardForm>
        <Text>x</Text>
      </KeyboardForm>,
    );
    expect(scrollToEnd).not.toHaveBeenCalled();
    await act(async () => listeners.keyboardDidShow());
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
  });

  it('keeps taps working while the keyboard is open', async () => {
    await render(
      <KeyboardForm>
        <Text>x</Text>
      </KeyboardForm>,
    );
    const container = screen.toJSON() as any;
    expect(container.children[0].props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('stops listening when it unmounts', async () => {
    const { unmount } = await render(
      <KeyboardForm>
        <Text>x</Text>
      </KeyboardForm>,
    );
    await unmount();
    expect(removed).toHaveBeenCalled();
  });
});
