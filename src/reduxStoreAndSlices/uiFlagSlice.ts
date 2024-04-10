// uiFlagsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIFlagsState {
  isSettingsModalOpen: boolean;
  isContextMenuOpen: boolean;
}

const initialState: UIFlagsState = {
  isSettingsModalOpen: false,
  isContextMenuOpen: false,
};

const uiFlagsSlice = createSlice({
  name: 'uiFlags',
  initialState,
  reducers: {
    setIsSettingsModalOpen(state, action: PayloadAction<boolean>) {
      state.isSettingsModalOpen = action.payload;
    },
    setIsContextMenuOpen(state, action: PayloadAction<boolean>) {
      state.isContextMenuOpen = action.payload;
    },
    toggleIsSettingsModalOpen(state) {
      state.isSettingsModalOpen = !state.isSettingsModalOpen;
    },
    toggleIsContextMenuOpen(state) {
      state.isContextMenuOpen = !state.isContextMenuOpen;
    },
  },
});

export const { setIsSettingsModalOpen, setIsContextMenuOpen, toggleIsSettingsModalOpen, toggleIsContextMenuOpen } = uiFlagsSlice.actions;
export default uiFlagsSlice.reducer;