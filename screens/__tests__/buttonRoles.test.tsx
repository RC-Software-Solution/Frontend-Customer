import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CancelModal from '../../components/popupmodel/popupModel';
import Onboarding from '../onboarding/onboarding';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('button roles', () => {
  it('the dialog dismiss button is exposed as a button', async () => {
    await render(<CancelModal visible onClose={jest.fn()} onConfirm={jest.fn()} cancelText="Keep Order" confirmText="Cancel Order" />);
    expect(screen.getByRole('button', { name: 'Keep Order' })).toBeTruthy();
  });

  it('Get Started is exposed as a button', async () => {
    await render(<Onboarding />);
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeTruthy();
  });
});
