// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import noticesReducer from './noticesSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    notices: noticesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
