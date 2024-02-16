import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type RegularHolidaySetting = {
  id: number;
  color: string;
  days: number[];
};

const initialState: RegularHolidaySetting[] = [
  { id: 1, color: '#d9e6ff', days: [6] },
  { id: 2, color: '#ffdcdc', days: [0] },
  { id: 3, color: '#00000010', days: [] },
];

const regularHolidaysSlice = createSlice({
  name: 'regularHolidays',
  initialState,
  reducers: {
    updateHolidaySetting: (state, action: PayloadAction<{ id: number; color?: string; days?: number[] }>) => {
      const { id, color, days } = action.payload;
      const settingIndex = state.findIndex(setting => setting.id === id);
      if (settingIndex !== -1) {
        if (color !== undefined) state[settingIndex].color = color;
        if (days !== undefined) state[settingIndex].days = days;
      }
    },
    resetRegularHolidays(state) {
      Object.assign(state, initialState)
    },
  },
});

export const { updateHolidaySetting, resetRegularHolidays } = regularHolidaysSlice.actions;
export default regularHolidaysSlice.reducer;
