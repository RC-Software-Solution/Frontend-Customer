// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import noticesReducer from './noticesSlice';
import menuReducer from './menuSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    notices: noticesReducer,
    menu: menuReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
