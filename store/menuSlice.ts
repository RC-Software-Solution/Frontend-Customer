import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TodayMenu } from '@/services/types/api.types';

// Today's menu as Home last loaded it; the Menu list screen reads it so it stays live too.
type MenuState = { menu: TodayMenu | null };

const initialState: MenuState = { menu: null };

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setMenu(state, action: PayloadAction<TodayMenu | null>) {
      state.menu = action.payload;
    },
  },
});

export const { setMenu } = menuSlice.actions;
export default menuSlice.reducer;
