import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WBSData, EventRow, RegularDaysOffSettingsType, isChartRow, isEventRow, isSeparatorRow, DateFormatType, HolidayColor, RowType } from '../types/DataTypes';
import { calculatePlannedDays, buildDependencyMap, updateDependentRows, resetEndDate, updateSeparatorRowDates, adjustColorOpacity, createNewRow, resolveDependencies } from '../utils/CommonUtils';
import copiedRowsReducer from './copiedRowsSlice';
import colorReducer from './colorSlice'
import baseSettingsReducer from './baseSettingsSlice';
import uiFlagsReducer from './uiFlagSlice';
import contextMenuReducer from './contextMenuSlice';
import { Column } from "@silevis/reactgrid";
import { initializedDummyData, initializedEmptyData } from './initialData';
import { initialHolidays, initialRegularDaysOffSetting } from './initialHolidays';
import { initialColumns } from './initialColumns';
import { assignIds } from '../components/Table/utils/wbsHelpers';

export interface ExtendedColumn extends Column {
  columnId: string;
  columnName?: string;
  visible: boolean;
}

export interface UndoableState {
  data: { [id: string]: WBSData },
  columns: ExtendedColumn[],
}

interface AddRowPayload {
  rowType: RowType;
  insertAtId: string;
  numberOfRows: number;
}

const initialState: {
  data: {
    [id: string]: WBSData
  },
  holidays: string[],
  holidayColor: HolidayColor,
  regularDaysOffSetting: RegularDaysOffSettingsType,
  regularDaysOff: number[],
  columns: ExtendedColumn[],
  showYear: boolean,
  dateFormat: DateFormatType,
  dependencyMap: { [id: string]: string[] },
  past: UndoableState[],
  future: UndoableState[]
} = {
  data: updateSeparatorRowDates(initializedDummyData),
  holidays: initialHolidays,
  holidayColor: { color: '#ffdcdc', subColor: adjustColorOpacity('#ffdcdc') },
  regularDaysOffSetting: initialRegularDaysOffSetting,
  regularDaysOff: Array.from(new Set(Object.values(initialRegularDaysOffSetting).flatMap(setting => setting.days))),
  showYear: false,
  dateFormat: "yyyy/M/d",
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
      const { updatedData, newDependencyMap } = resolveDependencies(data, state.holidays, state.regularDaysOff);
      state.dependencyMap = newDependencyMap;
      state.past.push({ data: state.data, columns: state.columns });
      state.future = [];
      if (state.past.length > 30) {
        state.past.shift();
      }
      state.data = updatedData;
    },
    addRow: (state, action: PayloadAction<AddRowPayload>) => {
      const { rowType, insertAtId, numberOfRows } = action.payload;
      const dataArray: WBSData[] = Object.values(state.data);
      const insertAtIndex = dataArray.findIndex(item => item.id === insertAtId);
      for (let i = 0; i < numberOfRows; i++) {
        const newRow = createNewRow(rowType);
        if (insertAtIndex >= 0) {
          dataArray.splice(insertAtIndex + i, 0, newRow);
        } else {
          dataArray.push(newRow);
        }
      }
      const data = assignIds(dataArray);
      const { updatedData, newDependencyMap } = resolveDependencies(data, state.holidays, state.regularDaysOff);
      state.dependencyMap = newDependencyMap;
      state.past.push({ data: state.data, columns: state.columns });
      state.future = [];
      if (state.past.length > 30) {
        state.past.shift();
      }
      state.data = updatedData;
    },
    insertCopiedRow: (state, action: PayloadAction<{ insertAtId: string, copiedRows: WBSData[] }>) => {
      const { insertAtId, copiedRows } = action.payload;
      if (!copiedRows || copiedRows.length === 0) return;
      const dataArray: WBSData[] = Object.values(state.data);
      const insertAtIndex = dataArray.findIndex(item => item.id === insertAtId);
      if (insertAtIndex >= 0) {
        dataArray.splice(insertAtIndex, 0, ...copiedRows.map(row => ({ ...row, id: "" })));
        const data = assignIds(dataArray);
        const { updatedData, newDependencyMap } = resolveDependencies(data, state.holidays, state.regularDaysOff);
        state.dependencyMap = newDependencyMap;
        state.past.push({ data: state.data, columns: state.columns });
        state.future = [];
        if (state.past.length > 30) {
          state.past.shift();
        }
        state.data = updatedData;
      }
    },
    deleteRows: (state, action: PayloadAction<string[]>) => {
      const idsToDelete = action.payload;
      const filteredData = Object.values(state.data).filter(row => !idsToDelete.includes(row.id));
      const data = assignIds(filteredData);
      const { updatedData, newDependencyMap } = resolveDependencies(data, state.holidays, state.regularDaysOff);
      state.dependencyMap = newDependencyMap;
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
    updateHolidayColor: (state, action: PayloadAction<string>) => {
      const updatedHolidayColor: HolidayColor = { color: '', subColor: '' };
      updatedHolidayColor.color = action.payload;
      updatedHolidayColor.subColor = adjustColorOpacity(updatedHolidayColor.color);
      state.holidayColor = updatedHolidayColor;
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
    updateEntireRegularDaysOffSetting: (state, action: PayloadAction<RegularDaysOffSettingsType>) => {
      const regularDaysOffSetting = action.payload;
      state.regularDaysOffSetting = regularDaysOffSetting;
      state.regularDaysOff = Array.from(new Set(Object.values(initialRegularDaysOffSetting).flatMap(setting => setting.days)));
      resetEndDate(state)
    },
    updateRegularDaysOffSetting: (state, action: PayloadAction<{ id: number; day: number; add: boolean }>) => {
      const { id, day, add } = action.payload;
      const setting = state.regularDaysOffSetting[id];
      if (!setting) return;
      if (add) {
        const allDays = Object.values(state.regularDaysOffSetting).flatMap(s => s.days);
        const uniqueDaysBeforeAdding = new Set(allDays);
        uniqueDaysBeforeAdding.add(day);
        if (uniqueDaysBeforeAdding.size === 7) {
          return;
        }
        if (!setting.days.includes(day)) {
          setting.days.push(day);
        }
      } else {
        setting.days = setting.days.filter(d => d !== day);
      }
      if (add) {
        Object.entries(state.regularDaysOffSetting).forEach(([key, otherSetting]) => {
          if (parseInt(key) !== id) {
            otherSetting.days = otherSetting.days.filter(d => d !== day);
          }
        });
      }
      state.regularDaysOff = Array.from(new Set(Object.values(state.regularDaysOffSetting).flatMap(s => s.days)));
      resetEndDate(state);
    },
    updateRegularDaysOffColor: (state, action: PayloadAction<{ id: number; color: string }>) => {
      const { id, color } = action.payload;
      const setting = state.regularDaysOffSetting[id];
      if (setting) {
        setting.color = color;
        setting.subColor = adjustColorOpacity(color);
      }
    },
    setDateFormat(state, action: PayloadAction<DateFormatType>) {
      state.dateFormat = action.payload;
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
  addRow,
  insertCopiedRow,
  deleteRows,
  setPlannedDate,
  setActualDate,
  setDisplayName,
  toggleSeparatorCollapsed,
  setHolidays,
  updateHolidayColor,
  setEventDisplayName,
  updateEventRow,
  updateSeparatorDates,
  updateEntireRegularDaysOffSetting,
  updateRegularDaysOffSetting,
  updateRegularDaysOffColor,
  setShowYear,
  setDateFormat,
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
    uiFlags: uiFlagsReducer,
    contextMenu: contextMenuReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;