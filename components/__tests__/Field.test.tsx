import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Field } from '../ui/Field';
import { color } from '@/theme';

const border = () => StyleSheet.flatten(screen.getByPlaceholderText('Email').props.style).borderColor;

test('border is transparent, brand on focus, transparent again on blur', async () => {
  await render(<Field placeholder="Email" />);
  const input = screen.getByPlaceholderText('Email');
  expect(border()).toBe('transparent');
  await fireEvent(input, 'focus');
  expect(border()).toBe(color.brandStrong);
  await fireEvent(input, 'blur');
  expect(border()).toBe('transparent');
});

test('error border wins over focus', async () => {
  await render(<Field placeholder="Email" error="x" />);
  await fireEvent(screen.getByPlaceholderText('Email'), 'focus');
  expect(border()).toBe(color.danger);
});

test('caller onFocus/onBlur still fire', async () => {
  const onFocus = jest.fn();
  const onBlur = jest.fn();
  await render(<Field placeholder="Email" onFocus={onFocus} onBlur={onBlur} />);
  const input = screen.getByPlaceholderText('Email');
  await fireEvent(input, 'focus');
  await fireEvent(input, 'blur');
  expect(onFocus).toHaveBeenCalledTimes(1);
  expect(onBlur).toHaveBeenCalledTimes(1);
});

test('password toggle flips its label and is a 48dp target', async () => {
  await render(<Field placeholder="Email" secure />);
  const toggle = screen.getByLabelText('Show password');
  const s = StyleSheet.flatten(toggle.props.style);
  expect(s.width).toBeGreaterThanOrEqual(48);
  expect(s.height).toBeGreaterThanOrEqual(48);
  await fireEvent.press(toggle);
  expect(screen.getByLabelText('Hide password')).toBeTruthy();
});

test('background is color.field unfocused and color.surface focused', async () => {
  await render(<Field placeholder="Email" />);
  const input = screen.getByPlaceholderText('Email');
  const bg = () => StyleSheet.flatten(screen.getByPlaceholderText('Email').props.style).backgroundColor;
  expect(bg()).toBe(color.field);
  await fireEvent(input, 'focus');
  expect(bg()).toBe(color.surface);
  await fireEvent(input, 'blur');
  expect(bg()).toBe(color.field);
});

test('a ref passed to Field reaches the TextInput', async () => {
  const ref = React.createRef<TextInput>();
  await render(<Field placeholder="Email" ref={ref} />);
  expect(typeof ref.current?.focus).toBe('function');
});
