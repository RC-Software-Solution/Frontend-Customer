import React from 'react';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import MenuListScreen from '../menuList/menuList.screen';
import { store } from '@/store';
import { setMenu } from '@/store/menuSlice';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  store.dispatch(setMenu(null));
});

it('without a loaded menu it says so and offers the way to Home, not "No items"', async () => {
  await render(
    <Provider store={store}>
      <MenuListScreen meal="lunch" kind="veg" />
    </Provider>,
  );
  expect(screen.getByText('Menu not loaded')).toBeTruthy();
  expect(screen.getByText("Open Home to load today's menu.")).toBeTruthy();
  expect(screen.queryByText('No items')).toBeNull();
  await act(async () => { fireEvent.press(screen.getByText('Go to Home')); });
  expect(router.replace).toHaveBeenCalledWith('/(tabs)');
});
