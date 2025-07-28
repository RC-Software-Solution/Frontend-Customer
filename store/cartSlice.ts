import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type CartItem = {
  meal_type: 'veg' | 'non-veg' | 'other'; // Enforce backend enum
  meal_time: 'breakfast' | 'lunch' | 'dinner';
  description: string;
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: any;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find((i) => i.name === action.payload.name);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    updateQuantity(state, action: PayloadAction<{ id: string; type: 'increase' | 'decrease' }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.quantity =
          action.payload.type === 'increase' ? item.quantity + 1 : Math.max(1, item.quantity - 1);
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, updateQuantity, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;