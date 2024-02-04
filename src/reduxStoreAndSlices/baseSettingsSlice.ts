import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import dayjs, { Dayjs } from 'dayjs';

interface BaseSettingsState {
  wbsWidth: number;
  maxWbsWidth: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  holidayInput: string;
  fileName: string;
}

const initialState: BaseSettingsState = {
  wbsWidth: 550,
  maxWbsWidth: 1500,
  dateRange: {
    startDate: new Date('2023-09-01'),
    endDate: new Date('2024-09-01'),
  },
  startDate: dayjs(new Date('2023-09-01')),
  endDate: dayjs(new Date('2024-09-01')),
  holidayInput: '',
  fileName: '',
};

const baseSettingsSlice = createSlice({
  name: 'wbs',
  initialState,
  reducers: {
    setWbsWidth(state, action: PayloadAction<number>) {
      state.wbsWidth = action.payload;
    },
    setMaxWbsWidth(state, action: PayloadAction<number>) {
      state.maxWbsWidth = action.payload;
    },
    setDateRange(state, action: PayloadAction<{ startDate: Date; endDate: Date }>) {
      state.dateRange = action.payload;
      state.startDate = dayjs(action.payload.startDate);
      state.endDate = dayjs(action.payload.endDate);
    },
    setHolidayInput(state, action: PayloadAction<string>) {
      state.holidayInput = action.payload;
    },
    setFileName(state, action: PayloadAction<string>) {
      state.fileName = action.payload;
    },
  },
});

export const { setWbsWidth, setMaxWbsWidth, setDateRange, setHolidayInput, setFileName } = baseSettingsSlice.actions;

export default baseSettingsSlice.reducer;
