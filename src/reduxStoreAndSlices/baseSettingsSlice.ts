import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { generateDates } from '../utils/CommonUtils';
import { initialHolidayInput } from './initialHolidays';
import { subWeeks, addMonths, format } from 'date-fns';

interface BaseSettingsState {
  wbsWidth: number;
  maxWbsWidth: number;
  calendarWidth: number;
  cellWidth: number;
  rowHeight: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  holidayInput: string;
  fileName: string;
  title: string;
}

const now = new Date();
const startDate = subWeeks(now, 2);
const endDate = addMonths(startDate, 24);

const initialState: BaseSettingsState = {
  wbsWidth: 690,
  maxWbsWidth: 690,
  calendarWidth: generateDates(format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')).length * 21,
  cellWidth: 21,
  rowHeight: 21,
  dateRange: {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  },
  holidayInput: initialHolidayInput,
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
      document.title = "Gantt - " + action.payload;
    },
    resetBaseSettings(state) {
      state.wbsWidth = initialState.wbsWidth;
      state.maxWbsWidth = initialState.maxWbsWidth;
      state.calendarWidth = initialState.calendarWidth;
      state.cellWidth = initialState.cellWidth;
      state.dateRange = initialState.dateRange;
      state.holidayInput = initialState.holidayInput;
      state.fileName = initialState.fileName;
      state.title = initialState.title;
      document.title = "Gantt"
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
  setTitle,
  resetBaseSettings
} = baseSettingsSlice.actions;

export default baseSettingsSlice.reducer;