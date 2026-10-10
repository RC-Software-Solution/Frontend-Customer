import reducer, { addToCart, updateQuantity, removeItem, clearCart } from './cartSlice';

const item = (over = {}) => ({
  id: '1', name: 'Hoppers', price: 300, quantity: 1,
  meal_type: 'veg' as const, meal_time: 'breakfast' as const, description: '', ...over,
});
const empty = { items: [] };

describe('cart', () => {
  it('adds a new item', () => {
    expect(reducer(empty, addToCart(item())).items).toHaveLength(1);
  });
  it('merges quantities for an item with the same name', () => {
    const s = reducer(reducer(empty, addToCart(item())), addToCart(item({ quantity: 2 })));
    expect(s.items).toHaveLength(1);
    expect(s.items[0].quantity).toBe(3);
  });
  it('increases and decreases quantity but never below 1', () => {
    let s = reducer(empty, addToCart(item()));
    s = reducer(s, updateQuantity({ id: '1', type: 'increase' }));
    expect(s.items[0].quantity).toBe(2);
    s = reducer(s, updateQuantity({ id: '1', type: 'decrease' }));
    s = reducer(s, updateQuantity({ id: '1', type: 'decrease' }));
    expect(s.items[0].quantity).toBe(1);
  });
  it('removes one item and clears all', () => {
    let s = reducer(reducer(empty, addToCart(item())), addToCart(item({ id: '2', name: 'Rice' })));
    s = reducer(s, removeItem('1'));
    expect(s.items.map((i) => i.id)).toEqual(['2']);
    expect(reducer(s, clearCart()).items).toEqual([]);
  });
});
