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
