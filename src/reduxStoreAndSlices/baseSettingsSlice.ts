import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import defaultHolidayInput from '../defaultSetting/defaultHolidays';
import { Column } from "@silevis/reactgrid";

export interface ExtendedColumn extends Column {
  columnId: string;
  columnName?: string;
  visible: boolean;
}

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
  showYear: boolean;
  columns: ExtendedColumn[];
}

const initialState: BaseSettingsState = {
  wbsWidth: 550,
  maxWbsWidth: 1500,
  dateRange: {
    startDate: '2023-09-01',
    endDate: '2024-09-01',
  },
  holidayInput: defaultHolidayInput,
  fileName: '',
  title: '',
  showYear: false,
  columns: [
    { columnId: "no", columnName: "No", width: 30, resizable: false, visible: true },
    { columnId: "displayName", columnName: "DisplayName", width: 100, resizable: true, reorderable: true, visible: true },
    { columnId: "color", columnName: "Color", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "plannedStartDate", columnName: "PlanS", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "plannedEndDate", columnName: "PlanE", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "plannedDays", columnName: "Days", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "actualStartDate", columnName: "ActS", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "actualEndDate", columnName: "ActE", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "dependency", columnName: "Dep", width: 60, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn1", columnName: "Text1", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn2", columnName: "Text2", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn3", columnName: "Text3", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn4", columnName: "Text4", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "isIncludeHolidays", columnName: "IncHol", width: 50, resizable: true, reorderable: true, visible: true },
  ],
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
    },
    setShowYear(state, action: PayloadAction<boolean>) {
      state.showYear = action.payload;
      state.columns = state.columns.map(column => {
        if (["plannedStartDate", "plannedEndDate", "actualStartDate", "actualEndDate"].includes(column.columnId)) {
          return { ...column, width: action.payload ? 75 : 40 };
        }
        return column;
      });
    },
    setColumns(state, action: PayloadAction<ExtendedColumn[]>) {
      state.columns = action.payload;
    },
    toggleColumnVisibility(state, action: PayloadAction<string>) {
      state.columns = state.columns.map(column =>
        column.columnId === action.payload && column.columnId !== 'no'
          ? { ...column, visible: !column.visible }
          : column
      );
    },    
    handleColumnResize(state, action: PayloadAction<{ columnId: string; width: number }>) {
      const columnIndex = state.columns.findIndex(col => col.columnId === action.payload.columnId);
      if (columnIndex >= 0) {
        state.columns[columnIndex] = { ...state.columns[columnIndex], width: action.payload.width };
      }
    },
  },
});

export const { setWbsWidth, setMaxWbsWidth, setDateRange, setHolidayInput, setFileName, setTitle, setShowYear, setColumns, toggleColumnVisibility, handleColumnResize } = baseSettingsSlice.actions;

export default baseSettingsSlice.reducer;