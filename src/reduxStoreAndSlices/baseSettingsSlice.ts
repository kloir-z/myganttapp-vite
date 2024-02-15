import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { generateDates } from '../components/Chart/utils/CalendarUtil';

interface BaseSettingsState {
  wbsWidth: number;
  maxWbsWidth: number;
  calendarWidth: number;
  cellWidth: number;
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
  calendarWidth: 100,
  cellWidth: 15,
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
    setCalendarWidth(state, action: PayloadAction<number>) {
      state.calendarWidth = action.payload;
    },
    setCellWidth(state, action: PayloadAction<number>) {
      state.cellWidth = action.payload;
      state.calendarWidth = generateDates(state.dateRange.startDate, state.dateRange.endDate).length * state.cellWidth;
    },
    setDateRange(state, action: PayloadAction<{ startDate: string; endDate: string }>) {
      state.dateRange = action.payload;
      state.calendarWidth = generateDates(action.payload.startDate, action.payload.endDate).length * state.cellWidth;
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

export const {
  setWbsWidth,
  setMaxWbsWidth,
  setCalendarWidth,
  setCellWidth,
  setDateRange,
  setHolidayInput,
  setFileName,
  setTitle
} = baseSettingsSlice.actions;

export default baseSettingsSlice.reducer;