import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const noticesSlice = createSlice({
  name: 'notices',
  initialState: { unread: 0 },
  reducers: {
    setUnread(state, action: PayloadAction<number>) {
      state.unread = action.payload;
    },
  },
});

export const { setUnread } = noticesSlice.actions;
export default noticesSlice.reducer;
