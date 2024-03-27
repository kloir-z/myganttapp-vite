import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WBSData, EventRow, RegularDaysOffSetting, isChartRow, isEventRow, isSeparatorRow } from '../types/DataTypes';
import { calculatePlannedDays, buildDependencyMap, updateDependentRows, resetEndDate, validateRowDates, updateDependency, updateSeparatorRowDates } from '../utils/CommonUtils';
import copiedRowsReducer from './copiedRowsSlice';
import colorReducer from './colorSlice'
import baseSettingsReducer from './baseSettingsSlice';
import { Column } from "@silevis/reactgrid";
import { initializedDummyData, initializedEmptyData } from './initialData';
import { initialHolidays, initialRegularDaysOffSetting } from './initialHolidays';
import { initialColumns } from './initialColumns';

export interface ExtendedColumn extends Column {
  columnId: string;
  columnName?: string;
  visible: boolean;
}

interface UndoableState {
  data: { [id: string]: WBSData },
  columns: ExtendedColumn[],
}

const initialState: {
  data: {
    [id: string]: WBSData
  },
  holidays: string[],
  regularDaysOffSetting: RegularDaysOffSetting[],
  regularDaysOff: number[],
  columns: ExtendedColumn[],
  showYear: boolean,
  dependencyMap: { [id: string]: string[] },
  past: UndoableState[],
  future: UndoableState[]
} = {
  data: updateSeparatorRowDates(initializedDummyData),
  holidays: initialHolidays,
  regularDaysOffSetting: initialRegularDaysOffSetting,
  regularDaysOff: Array.from(new Set(initialRegularDaysOffSetting.flatMap(setting => setting.days))),
  showYear: false,
  columns: initialColumns,
  dependencyMap: buildDependencyMap(initializedDummyData),
  past: [{
    data: updateSeparatorRowDates(initializedDummyData),
    columns: initialColumns
  }],
  future: []
};

const emptyState = {
  ...initialState,
  data: initializedEmptyData,
  past: initialState.past.map(p => ({ ...p, data: initializedEmptyData })),
};

export const wbsDataSlice = createSlice({
  name: 'wbsData',
  initialState,
  reducers: {
    setEntireData: (state, action: PayloadAction<{ [id: string]: WBSData }>) => {
      const data = action.payload;
      let updatedData = Object.keys(data).reduce<{ [id: string]: WBSData }>((acc, rowId) => {
        const row = data[rowId];
        if (isChartRow(row) && row.dependency) {
          let updatedRowData = validateRowDates(row);
          updatedRowData = updateDependency(row, data, rowId);
          acc[rowId] = updatedRowData;
        } else {
          acc[rowId] = row;
        }
        return acc;
      }, {});
      state.dependencyMap = buildDependencyMap(updatedData);
      const visited = new Set<string>();
      Object.keys(state.dependencyMap).forEach(dependentId => {
        const row = updatedData[dependentId];
        if (isChartRow(row) && row.plannedStartDate && row.plannedEndDate) {
          updateDependentRows({
            data: updatedData,
            holidays: state.holidays,
            regularDaysOff: state.regularDaysOff,
            dependencyMap: state.dependencyMap
          }, dependentId, row.plannedStartDate, row.plannedEndDate, visited);
        }
      });
      updatedData = updateSeparatorRowDates(updatedData);
      state.past.push({ data: state.data, columns: state.columns });
      state.future = [];
      if (state.past.length > 30) {
        state.past.shift();
      }
      state.data = updatedData;
    },
    setPlannedDate: (state, action: PayloadAction<{ id: string; startDate: string; endDate: string }>) => {
      const { id, startDate, endDate } = action.payload;
      const chartRow = state.data[id];
      if (isChartRow(chartRow)) {
        chartRow.plannedStartDate = startDate;
        chartRow.plannedEndDate = endDate;
        chartRow.plannedDays = calculatePlannedDays(startDate, endDate, state.holidays, chartRow.isIncludeHolidays, state.regularDaysOff);
        updateDependentRows(state, id, startDate, endDate);
        const updatedData = updateSeparatorRowDates(state.data);
        state.data = updatedData;
      }
    },
    setActualDate: (state, action: PayloadAction<{ id: string; startDate: string; endDate: string }>) => {
      const { id, startDate, endDate } = action.payload;
      const chartRow = state.data[id];
      if (isChartRow(chartRow)) {
        chartRow.actualStartDate = startDate;
        chartRow.actualEndDate = endDate;
      }
    },
    setDisplayName: (state, action: PayloadAction<{ id: string; displayName: string }>) => {
      const { id, displayName } = action.payload;
      if (state.data[id]) {
        state.data[id].displayName = displayName;
      }
    },
    toggleSeparatorCollapsed: (state, action: PayloadAction<{ id: string; isCollapsed?: boolean }>) => {
      const { id, isCollapsed } = action.payload;
      const separatorRow = state.data[id];
      if (isSeparatorRow(separatorRow)) {
        separatorRow.isCollapsed = isCollapsed !== undefined ? isCollapsed : !separatorRow.isCollapsed;
      }
    },
    setHolidays: (state, action: PayloadAction<string[]>) => {
      const newHolidays = action.payload;
      const oldHolidays = Array.from(state.holidays);

      const addedHolidays = newHolidays.filter(h => !oldHolidays.includes(h));
      const removedHolidays = oldHolidays.filter(h => !newHolidays.includes(h));

      const affectedHolidays = [...addedHolidays, ...removedHolidays];
      state.holidays = newHolidays;

      resetEndDate(state, affectedHolidays)
    },
    setEventDisplayName: (state, action: PayloadAction<{ id: string; eventIndex: number; displayName: string }>) => {
      const { id, eventIndex, displayName } = action.payload;
      const eventRow = state.data[id];
      if (isEventRow(eventRow)) {
        if (eventRow.eventData[eventIndex]) {
          eventRow.eventData[eventIndex].eachDisplayName = displayName;
        }
      }
    },
    updateEventRow: (state, action: PayloadAction<{ id: string; updatedEventRow: EventRow }>) => {
      const { id, updatedEventRow } = action.payload;
      state.data[id] = updatedEventRow;
      const updatedData = updateSeparatorRowDates(state.data);
      state.data = updatedData;
    },
    updateSeparatorDates: (state) => {
      const updatedData = updateSeparatorRowDates(state.data);
      state.data = updatedData;
    },
    updateRegularDaysOffSetting: (state, action: PayloadAction<RegularDaysOffSetting[]>) => {
      const regularDaysOffSetting = action.payload;
      state.regularDaysOffSetting = regularDaysOffSetting;
      state.regularDaysOff = Array.from(new Set(regularDaysOffSetting.flatMap(setting => setting.days)));
      resetEndDate(state)
    },
    setShowYear(state, action: PayloadAction<boolean>) {
      state.showYear = action.payload;
      state.columns = state.columns.map(column => {
        if (["plannedStartDate", "plannedEndDate", "actualStartDate", "actualEndDate"].includes(column.columnId)) {
          return { ...column, width: action.payload ? 90 : 50 };
        }
        return column;
      });
    },
    setColumns(state, action: PayloadAction<ExtendedColumn[]>) {
      state.columns = action.payload;
    },
    toggleColumnVisibility(state, action: PayloadAction<string>) {
      state.past.push({ data: state.data, columns: state.columns });
      state.future = [];
      if (state.past.length > 30) {
        state.past.shift();
      }
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
    resetStore: () => emptyState,
    pushPastState: (state) => {
      state.past.push({ data: state.data, columns: state.columns });
      state.future = [];
      if (state.past.length > 31) {
        state.past.shift();
      }
    },
    removePastState: (state, action: PayloadAction<number>) => {
      const numberToRemove = action.payload;
      state.past.length = Math.max(state.past.length - numberToRemove, 0);
    },
    undo: (state) => {
      if (state.past.length > 1) {
        const lastPast = state.past.pop();
        if (lastPast) {
          state.future.unshift({ data: state.data, columns: state.columns });
          state.data = lastPast.data;
          state.columns = lastPast.columns;
          state.dependencyMap = buildDependencyMap(lastPast.data);
        }
      }
    },
    redo: (state) => {
      if (state.future.length > 0) {
        const firstFuture = state.future.shift();
        if (firstFuture) {
          state.past.push({ data: state.data, columns: state.columns });
          state.data = firstFuture.data;
          state.columns = firstFuture.columns;
          state.dependencyMap = buildDependencyMap(firstFuture.data);
        }
      }
    },
  },
});

export const {
  setEntireData,
  setPlannedDate,
  setActualDate,
  setDisplayName,
  toggleSeparatorCollapsed,
  setHolidays,
  setEventDisplayName,
  updateEventRow,
  updateSeparatorDates,
  updateRegularDaysOffSetting,
  setShowYear,
  setColumns,
  toggleColumnVisibility,
  handleColumnResize,
  resetStore,
  pushPastState,
  removePastState,
  undo,
  redo,
} = wbsDataSlice.actions;

export const store = configureStore({
  reducer: {
    wbsData: wbsDataSlice.reducer,
    copiedRows: copiedRowsReducer,
    color: colorReducer,
    baseSettings: baseSettingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;