import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BaseSettingsState {
  wbsWidth: number;
  maxWbsWidth: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  holidayInput: string;
  fileName: string;
  title: string;
}

const initialState: BaseSettingsState = {
  wbsWidth: 550,
  maxWbsWidth: 1500,
  dateRange: {
    startDate: '2023-09-01',
    endDate: '2024-09-01',
  },
  holidayInput: '',
  fileName: '',
  title: ''
};

const baseSettingsSlice = createSlice({
  name: 'baseSettings',
  initialState,
  reducers: {
    setWbsWidth(state, action: PayloadAction<number>) {
      state.wbsWidth = action.payload;
    },
    setMaxWbsWidth(state, action: PayloadAction<number>) {
      state.maxWbsWidth = action.payload;
    },
    setDateRange(state, action: PayloadAction<{ startDate: string; endDate: string }>) {
      state.dateRange = action.payload;
    },
    setHolidayInput(state, action: PayloadAction<string>) {
      state.holidayInput = action.payload;
    },
    setFileName(state, action: PayloadAction<string>) {
      state.fileName = action.payload;
    },
    setTitle(state, action: PayloadAction<string>) {
      state.title = action.payload;
    }
  },
});

export const { setWbsWidth, setMaxWbsWidth, setDateRange, setHolidayInput, setFileName, setTitle } = baseSettingsSlice.actions;

export default baseSettingsSlice.reducer;