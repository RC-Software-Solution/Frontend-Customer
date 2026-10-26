import React from 'react';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import MenuListScreen from '../menuList/menuList.screen';
import { store } from '@/store';
import { addToCart, clearCart } from '@/store/cartSlice';
import { setMenu } from '@/store/menuSlice';
import { TodayMenu, TodaySession } from '@/services/types/api.types';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

const food = (id: number, name: string, meal_type: 'veg' | 'non-veg', price = '300') =>
  ({ id, name, description: `${name} desc`, price, meal_type, image_url: undefined, created_at: '', updated_at: '' }) as any;

const session = (meal_time: TodaySession['meal_time'], state: TodaySession['state'], over: Partial<TodaySession> = {}): TodaySession => ({
  id: 10,
  date: '2026-10-11',
  meal_time,
  start_time: '06:00:00',
  end_time: '09:30:00',
  state,
  opens_at: '2026-10-11T00:30:00.000Z',
  closes_at: '2026-10-11T04:00:00.000Z',
  items: [
    { id: 1, food_item_id: 1, available_quantity: 5, foodItem: food(1, 'String Hoppers', 'veg') },
    { id: 2, food_item_id: 2, available_quantity: 5, foodItem: food(2, 'Egg Hoppers', 'non-veg') },
    { id: 3, food_item_id: 3, available_quantity: 5, foodItem: food(3, 'Milk Rice', 'veg', '250') },
  ],
  ...over,
});

const menu = (sessions: Partial<TodayMenu['sessions']>): TodayMenu => ({
  date: '2026-10-11',
  now: '2026-10-11T02:00:00.000Z',
  sessions: { breakfast: null, lunch: null, dinner: null, ...sessions },
});

const mount = async (m: TodayMenu, meal: 'breakfast' | 'lunch' | 'dinner' = 'breakfast', kind: 'veg' | 'nonveg' = 'veg') => {
  store.dispatch(setMenu(m));
  await render(
    <Provider store={store}>
      <MenuListScreen meal={meal} kind={kind} />
    </Provider>,
  );
};

const press = async (label: string) => fireEvent.press(screen.getByLabelText(label));
const cart = () => store.getState().cart.items;

beforeEach(() => {
  jest.clearAllMocks();
  store.dispatch(clearCart());
});
afterEach(() => jest.restoreAllMocks());

describe('the list', () => {
  it('titles the list with the kind and count, and names the meal', async () => {
    await mount(menu({ breakfast: session('breakfast', 'open') }));
    expect(screen.getByText('Vegetarian Items (2)')).toBeTruthy();
    expect(screen.getByText('Breakfast, today')).toBeTruthy();
    expect(screen.getByText('Breakfast is open now')).toBeTruthy();
    expect(screen.getByText('String Hoppers')).toBeTruthy();
    expect(screen.queryByText('Egg Hoppers')).toBeNull();
  });

  it('shows the non-vegetarian dishes for kind nonveg', async () => {
    await mount(menu({ breakfast: session('breakfast', 'open') }), 'breakfast', 'nonveg');
    expect(screen.getByText('Non-Vegetarian Items (1)')).toBeTruthy();
    expect(screen.getByText('Egg Hoppers')).toBeTruthy();
  });

  it('an upcoming session explains when it opens and its Add buttons are inert', async () => {
    await mount(menu({ dinner: session('dinner', 'upcoming', { start_time: '18:00:00' }) }), 'dinner');
    expect(screen.getByText('Ordering opens today at 6:00 PM.')).toBeTruthy();
    const add = screen.getByLabelText('Add String Hoppers');
    expect(add.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(add);
    expect(cart()).toEqual([]);
  });

  it('a closed session has an inert Add too', async () => {
    await mount(menu({ breakfast: session('breakfast', 'closed') }));
    expect(screen.getByText('Ordering closed today at 9:30 AM.')).toBeTruthy();
    await press('Add String Hoppers');
    expect(cart()).toEqual([]);
  });

  it('an empty tab shows the empty state with the tab message', async () => {
    await mount(menu({}), 'lunch');
    expect(screen.getByText('No items')).toBeTruthy();
    expect(screen.getAllByText('No lunch menu has been published for today.').length).toBeGreaterThan(0);
  });

  it('follows the menu live: a session that closes while the list is open makes Add inert', async () => {
    await mount(menu({ breakfast: session('breakfast', 'open') }));
    await act(async () => {
      store.dispatch(setMenu(menu({ breakfast: session('breakfast', 'closed') })));
    });
    expect(screen.getByText('Ordering closed today at 9:30 AM.')).toBeTruthy();
    await press('Add String Hoppers');
    expect(cart()).toEqual([]);
  });

  it('a bad link (missing or repeated meal) falls back to Breakfast / Vegetarian instead of crashing', async () => {
    store.dispatch(setMenu(menu({ breakfast: session('breakfast', 'open') })));
    const view = await render(
      <Provider store={store}>
        <MenuListScreen meal={undefined} kind={undefined} />
      </Provider>,
    );
    expect(screen.getByText('Vegetarian Items (2)')).toBeTruthy();
    expect(screen.getByText('Breakfast, today')).toBeTruthy();
    await view.rerender(
      <Provider store={store}>
        <MenuListScreen meal={['lunch', 'dinner']} kind={['nonveg', 'veg']} />
      </Provider>,
    );
    expect(screen.getByText('Lunch, today')).toBeTruthy(); // first element of an array
    expect(screen.getByText('Non-Vegetarian Items (0)')).toBeTruthy();
  });

  it('the back button goes back', async () => {
    await mount(menu({ breakfast: session('breakfast', 'open') }));
    await press('Go back');
    expect(router.back).toHaveBeenCalled();
  });
});

describe('adding to the cart', () => {
  it('Add puts the dish in the cart with the session date and meal', async () => {
    await mount(menu({ breakfast: session('breakfast', 'open') }));
    await press('Add String Hoppers');
    expect(cart()).toEqual([
      expect.objectContaining({
        id: '1',
        food_item_id: 1,
        name: 'String Hoppers',
        price: 300,
        quantity: 1,
        meal_type: 'veg',
        meal_time: 'breakfast',
        description: 'String Hoppers desc',
        session_date: '2026-10-11',
      }),
    ]);
  });

  it('after Add the row shows a stepper; + and - change the quantity and - at 1 removes the dish', async () => {
    await mount(menu({ breakfast: session('breakfast', 'open') }));
    await press('Add String Hoppers');
    expect(screen.queryByLabelText('Add String Hoppers')).toBeNull();
    await press('Increase quantity of String Hoppers');
    expect(cart()[0].quantity).toBe(2);
    expect(screen.getByText('2')).toBeTruthy();
    await press('Decrease quantity of String Hoppers');
    expect(cart()[0].quantity).toBe(1);
    await press('Decrease quantity of String Hoppers');
    expect(cart()).toEqual([]);
    expect(screen.getByLabelText('Add String Hoppers')).toBeTruthy();
  });

  it('adding from another meal asks first; "Start new cart" clears the cart then adds', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    store.dispatch(addToCart({ id: '9', name: 'Rice and Curry', price: 400, quantity: 1, meal_type: 'veg', meal_time: 'lunch', description: '' }));
    await mount(menu({ breakfast: session('breakfast', 'open') }));
    await press('Add String Hoppers');

    expect(alert).toHaveBeenCalledWith(
      'Start a new cart?',
      'Your cart has Lunch items. An order can only hold one meal, so adding this will clear it.',
      expect.any(Array),
    );
    expect(cart().map((i) => i.name)).toEqual(['Rice and Curry']); // nothing changes until a choice is made
    const buttons = alert.mock.calls[0][2]!;
    await act(async () => buttons.find((b) => b.text === 'Start new cart')!.onPress!());
    expect(cart().map((i) => i.name)).toEqual(['String Hoppers']);
  });

  it('"Keep cart" leaves the cart unchanged', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    store.dispatch(addToCart({ id: '9', name: 'Rice and Curry', price: 400, quantity: 1, meal_type: 'veg', meal_time: 'lunch', description: '' }));
    await mount(menu({ breakfast: session('breakfast', 'open') }));
    await press('Add String Hoppers');
    const keep = alert.mock.calls[0][2]!.find((b) => b.text === 'Keep cart')!;
    expect(keep.style).toBe('cancel');
    expect(cart().map((i) => i.name)).toEqual(['Rice and Curry']);
  });

  it('the View cart bar shows the quantity and total, and opens the cart', async () => {
    await mount(menu({ breakfast: session('breakfast', 'open') }));
    expect(screen.queryByText(/View cart/)).toBeNull(); // hidden while the cart is empty
    await press('Add String Hoppers');
    await press('Add Milk Rice');
    await press('Increase quantity of Milk Rice');
    expect(screen.getByText('View cart (3)')).toBeTruthy();
    expect(screen.getByText('Rs. 800.00')).toBeTruthy();
    await fireEvent.press(screen.getByText('View cart (3)'));
    expect(router.push).toHaveBeenCalledWith('/(routes)/cart');
  });
});
