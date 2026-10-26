import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import CancelModal from '../popupmodel/popupModel';

test('renders the default title and message', async () => {
  await render(<CancelModal visible onClose={jest.fn()} onConfirm={jest.fn()} />);
  expect(screen.getByText('Cancel Order')).toBeTruthy();
  expect(screen.getByText('Are you sure you want to cancel this order?')).toBeTruthy();
});

test('No calls onClose, Yes calls onConfirm', async () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  await render(<CancelModal visible onClose={onClose} onConfirm={onConfirm} />);
  await fireEvent.press(screen.getByText('No'));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Yes'));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test('custom title and confirmText render', async () => {
  await render(
    <CancelModal visible onClose={jest.fn()} onConfirm={jest.fn()} title="Delete?" confirmText="Delete" />,
  );
  expect(screen.getByText('Delete?')).toBeTruthy();
  expect(screen.getByText('Delete')).toBeTruthy();
});

describe('requireText', () => {
  const setup = async (visible = true) => {
    const onConfirm = jest.fn();
    const utils = await render(<CancelModal visible={visible} onClose={jest.fn()} onConfirm={onConfirm} requireText="DELETE" confirmText="Yes, Delete" />);
    return { onConfirm, ...utils };
  };
  const input = () => screen.getByLabelText('Type DELETE to confirm');

  test('without requireText there is no input and confirm calls onConfirm', async () => {
    const onConfirm = jest.fn();
    await render(<CancelModal visible onClose={jest.fn()} onConfirm={onConfirm} />);
    expect(screen.queryByLabelText('Type DELETE to confirm')).toBeNull();
    expect(screen.queryByText(/to confirm/)).toBeNull();
    await fireEvent.press(screen.getByText('Yes'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('shows the caption and an input, with confirm disabled', async () => {
    await setup();
    expect(screen.getByText('Type DELETE to confirm')).toBeTruthy();
    expect(input()).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeDisabled();
  });

  test.each(['', 'delete', 'DELET', 'DELETE x'])('does not confirm for %p', async (typed) => {
    const { onConfirm } = await setup();
    await fireEvent.changeText(input(), typed);
    await fireEvent.press(screen.getByText('Yes, Delete'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test.each(['DELETE', ' DELETE '])('confirms exactly once for %p', async (typed) => {
    const { onConfirm } = await setup();
    await fireEvent.changeText(input(), typed);
    expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeEnabled();
    await fireEvent.press(screen.getByText('Yes, Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('closing and reopening clears the input and disables confirm again', async () => {
    const onConfirm = jest.fn();
    const ui = (visible: boolean) => (
      <CancelModal visible={visible} onClose={jest.fn()} onConfirm={onConfirm} requireText="DELETE" confirmText="Yes, Delete" />
    );
    const { rerender } = await render(ui(true));
    await fireEvent.changeText(input(), 'DELETE');
    await rerender(ui(false));
    await rerender(ui(true));
    expect(input().props.value).toBe('');
    expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeDisabled();
    await fireEvent.press(screen.getByText('Yes, Delete'));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
