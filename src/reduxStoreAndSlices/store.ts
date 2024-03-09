import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WBSData, ChartRow, EventRow, RegularHolidaySetting } from '../types/DataTypes';
import { calculatePlannedDays, addPlannedDays, calculateDependencies, CalculateDependenciesParams } from '../components/Chart/utils/CalendarUtil';
import copiedRowsReducer from './copiedRowsSlice';
import colorReducer from './colorSlice'
import baseSettingsReducer from './baseSettingsSlice';
import { Column } from "@silevis/reactgrid";
import { initializedDummyData, initializedEmptyData } from './initialData';
import { initialHolidays, initialRegularHolidaySetting } from './initialHolidays';
import { initialColumns } from './initialColumns';
import { cdate } from "cdate";

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
  regularHolidaySetting: RegularHolidaySetting[],
  regularHolidays: number[],
  isFixedData: boolean,
  columns: ExtendedColumn[],
  showYear: boolean,
  dependencyMap: { [id: string]: string[] },
  past: UndoableState[],
  future: UndoableState[]
} = {
  data: initializedDummyData,
  holidays: initialHolidays,
  regularHolidaySetting: initialRegularHolidaySetting,
  regularHolidays: Array.from(new Set(initialRegularHolidaySetting.flatMap(setting => setting.days))),
  isFixedData: true,
  showYear: false,
  columns: initialColumns,
  dependencyMap: buildDependencyMap(initializedDummyData),
  past: [{
    data: initializedDummyData,
    columns: initialColumns
  }],
  future: []
};

const emptyState = {
  ...initialState,
  data: initializedEmptyData,
  past: initialState.past.map(p => ({ ...p, data: initializedEmptyData })),
};

function buildDependencyMap(data: { [id: string]: WBSData }) {
  const dependencyMap: { [id: string]: string[] } = {};
  Object.keys(data).forEach(id => {
    const row = data[id];
    if (row.rowType === 'Chart') {
      const chartRow = row as ChartRow;
      if (chartRow.dependentId) {
        if (!dependencyMap[chartRow.dependentId]) {
          dependencyMap[chartRow.dependentId] = [];
        }
        dependencyMap[chartRow.dependentId].push(chartRow.id);
      }
    }
  });
  return dependencyMap;
}

const updateDependentRows = (
  state: { data: { [id: string]: WBSData }, holidays: string[], regularHolidays: number[] },
  currentId: string,
  newStartDate: string,
  newEndDate: string,
  visited = new Set<string>()
) => {
  if (visited.has(currentId)) {
    return;
  }
  visited.add(currentId);

  Object.values(state.data).forEach((row: WBSData) => {
    if (!visited.has(row.id)) {
      if (row.rowType === 'Chart') {
        const chartRow = row as ChartRow;

        if (chartRow.id === (state.data[currentId] as ChartRow).dependentId) {
          const dependency = (state.data[currentId] as ChartRow).dependency.toLowerCase();
          const params: CalculateDependenciesParams = {
            currentDependency: dependency,
            plannedDays: chartRow.plannedDays || 1,
            isIncludeHolidays: chartRow.isIncludeHolidays,
            baseDate: newStartDate,
            calculationDirection: 'back',
            stateHolidays: state.holidays,
            stateRegularHolidays: state.regularHolidays,
          };
          const result = calculateDependencies(params);
          chartRow.plannedEndDate = result.endDate;
          chartRow.plannedStartDate = result.startDate;
          updateDependentRows(state, chartRow.id, result.startDate, result.endDate, visited);
        } else if (chartRow.dependentId === currentId) {
          const dependency = chartRow.dependency.toLowerCase();
          const baseDate = dependency.startsWith('sameas') ? newStartDate : newEndDate;
          const params: CalculateDependenciesParams = {
            currentDependency: dependency,
            plannedDays: chartRow.plannedDays || 1,
            isIncludeHolidays: chartRow.isIncludeHolidays,
            baseDate: baseDate,
            calculationDirection: 'forward',
            stateHolidays: state.holidays,
            stateRegularHolidays: state.regularHolidays,
          };
          const result = calculateDependencies(params);
          chartRow.plannedStartDate = (result.startDate);
          chartRow.plannedEndDate = (result.endDate);
          updateDependentRows(state, chartRow.id, result.startDate, result.endDate, visited);
        }
      }
    }
  });
};

function isDateInRange(dateString: string, startDateString: string, endDateString: string): boolean {
  const date = cdate(dateString);
  const startDate = cdate(startDateString);
  const endDate = cdate(endDateString);
  return +date >= +startDate && +date <= +endDate;
}

const resetEndDate = (
  state: { data: { [id: string]: WBSData }, holidays: string[], regularHolidays: number[] },
  affectedHolidays?: string[]
) => {
  Object.keys(state.data).forEach(id => {
    const row = state.data[id];
    if (row.rowType === 'Chart') {
      const chartRow = row as ChartRow;
      const startDate = chartRow.plannedStartDate;
      const endDate = chartRow.plannedEndDate;
      if (!affectedHolidays || affectedHolidays.some(holiday => isDateInRange(holiday, startDate, endDate))) {
        const includeStartDay = true;
        const dependentEndDate = addPlannedDays(startDate, chartRow.plannedDays, state.holidays, chartRow.isIncludeHolidays, includeStartDay, state.regularHolidays);
        state.data[id] = {
          ...chartRow,
          plannedEndDate: (dependentEndDate)
        };
        updateDependentRows(state, id, startDate, dependentEndDate);
      }
    }
  });
};

function validateDateString(dateString: string | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const startDate = new Date("1970/01/01");
  const endDate = new Date("2099/12/31");
  if (date < startDate || date > endDate) {
    return "";
  }
  return dateString;
}

export const wbsDataSlice = createSlice({
  name: 'wbsData',
  initialState,
  reducers: {
    simpleSetData: (state, action: PayloadAction<{ [id: string]: WBSData }>) => {
      const data = action.payload;
      const updatedData = Object.keys(data).reduce<{ [id: string]: WBSData }>((acc, rowId) => {
        const rowData = data[rowId];
        if (rowData.rowType === 'Chart') {
          const chartRowData = rowData as ChartRow;
          let updatedRowData = { ...chartRowData };

          updatedRowData.plannedStartDate = validateDateString(chartRowData.plannedStartDate);
          updatedRowData.plannedEndDate = validateDateString(chartRowData.plannedEndDate);
          updatedRowData.actualStartDate = validateDateString(chartRowData.actualStartDate);
          updatedRowData.actualEndDate = validateDateString(chartRowData.actualEndDate);

          if (chartRowData.dependency) {
            const parts = chartRowData.dependency.split(',');
            if (parts.length >= 2) {
              const refRowNo = parts[1].trim();
              let refRowId: string | undefined;

              if (refRowNo.startsWith('+') || refRowNo.startsWith('-')) {
                const offset = parseInt(refRowNo, 10);
                let currentIndex = Object.keys(data).indexOf(rowId);
                let steps = Math.abs(offset);

                while (steps > 0 && currentIndex >= 0 && currentIndex < Object.keys(data).length) {
                  currentIndex += (offset / Math.abs(offset));
                  if (currentIndex < 0 || currentIndex >= Object.keys(data).length) {
                    break;
                  }
                  if (data[Object.keys(data)[currentIndex]].rowType === 'Chart') {
                    steps--;
                  }
                }

                if (currentIndex >= 0 && currentIndex < Object.keys(data).length) {
                  refRowId = Object.keys(data)[currentIndex];
                }
              } else if (refRowNo && chartRowData.dependentId) {
                const matchingRow = Object.entries(data).find(([key, value]) => key === chartRowData.dependentId && value.rowType === 'Chart') as [string, ChartRow] | undefined;
                if (matchingRow) {
                  const [, matchingRowData] = matchingRow;
                  parts[1] = matchingRowData.no.toString();
                  updatedRowData.dependency = parts.join(',');
                }
              } else {
                const targetNo = parseInt(refRowNo, 10);
                refRowId = Object.keys(data).find(key => {
                  const keyRowData = data[key];
                  return keyRowData.rowType === 'Chart' && (keyRowData as ChartRow).no === targetNo;
                });
              }
              if (refRowId) {
                updatedRowData = {
                  ...chartRowData,
                  dependentId: refRowId,
                  dependency: chartRowData.dependency
                };
              }
            }
          }
          acc[rowId] = updatedRowData;
        } else {
          acc[rowId] = rowData;
        }
        return acc;
      }, {});
      const visited = new Set<string>();
      const updateDependentRowsInline = (updatedData: { [id: string]: WBSData }, currentId: string, newEndDate: string) => {
        if (visited.has(currentId)) return;
        visited.add(currentId);
        Object.entries(updatedData).forEach(([id, row]) => {
          if (row.rowType === 'Chart') {
            const chartRow = row as ChartRow;
            if (chartRow.dependentId === currentId) {
              const dependency = chartRow.dependency.toLowerCase();
              if (!dependency) return;
              const dependencyParts = dependency.split(',');
              let newStartDate;
              switch (dependencyParts[0]) {
                case 'after': {
                  let offsetDays = parseInt(dependencyParts[2], 10);
                  offsetDays = isNaN(offsetDays) || offsetDays <= 0 ? 1 : offsetDays;
                  const includeStartDay = false;
                  newStartDate = addPlannedDays(newEndDate, offsetDays, state.holidays, chartRow.isIncludeHolidays, includeStartDay, state.regularHolidays);
                  break;
                }
                case 'sameas': {
                  const dependentRow = updatedData[chartRow.dependentId] as ChartRow;
                  newStartDate = dependentRow.plannedStartDate;
                  break;
                }
                default:
                  return;
              }
              const includeStartDay = true;
              const dependentEndDate = addPlannedDays(newStartDate, chartRow.plannedDays, state.holidays, chartRow.isIncludeHolidays, includeStartDay, state.regularHolidays);
              const updatedChartRow = {
                ...chartRow,
                plannedStartDate: newStartDate,
                plannedEndDate: dependentEndDate
              };
              updatedData[id] = updatedChartRow;
              updateDependentRowsInline(updatedData, id, dependentEndDate);
            }
          }
        });
      };

      Object.keys(updatedData).forEach(id => {
        const row = updatedData[id];
        if (row.rowType === 'Chart' && row.plannedEndDate) {
          updateDependentRowsInline(updatedData, id, row.plannedEndDate);
        }
      });

      state.past.push({ data: state.data, columns: state.columns });
      state.future = [];
      if (state.past.length > 30) {
        state.past.shift();
      }
      state.data = updatedData;
      state.dependencyMap = buildDependencyMap(updatedData);
    },
    setPlannedStartDate: (state, action: PayloadAction<{ id: string; startDate: string }>) => {
      state.isFixedData = false;
      const { id, startDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        const chartRow = state.data[id] as ChartRow;
        chartRow.plannedStartDate = startDate;
        chartRow.plannedDays = calculatePlannedDays(startDate, chartRow.plannedEndDate, state.holidays, chartRow.isIncludeHolidays, state.regularHolidays);
        updateDependentRows(state, id, startDate, chartRow.plannedEndDate);
      }
    },
    setPlannedEndDate: (state, action: PayloadAction<{ id: string; endDate: string }>) => {
      state.isFixedData = false;
      const { id, endDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        const chartRow = state.data[id] as ChartRow;
        chartRow.plannedEndDate = endDate;
        chartRow.plannedDays = calculatePlannedDays(chartRow.plannedStartDate, endDate, state.holidays, chartRow.isIncludeHolidays, state.regularHolidays);
        updateDependentRows(state, id, chartRow.plannedStartDate, endDate);
      }
    },
    setPlannedStartAndEndDate: (state, action: PayloadAction<{ id: string; startDate: string; endDate: string }>) => {
      state.isFixedData = false;
      const { id, startDate, endDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        const chartRow = state.data[id] as ChartRow;
        chartRow.plannedStartDate = startDate;
        chartRow.plannedEndDate = endDate;
        chartRow.plannedDays = calculatePlannedDays(startDate, endDate, state.holidays, chartRow.isIncludeHolidays, state.regularHolidays);
        updateDependentRows(state, id, startDate, endDate);
      }
    },
    setActualStartDate: (state, action: PayloadAction<{ id: string; startDate: string }>) => {
      state.isFixedData = false;
      const { id, startDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        (state.data[id] as ChartRow).actualStartDate = startDate;
      }
    },
    setActualEndDate: (state, action: PayloadAction<{ id: string; endDate: string }>) => {
      state.isFixedData = false;
      const { id, endDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        (state.data[id] as ChartRow).actualEndDate = endDate;
      }
    },
    setActualStartAndEndDate: (state, action: PayloadAction<{ id: string; startDate: string; endDate: string }>) => {
      state.isFixedData = false;
      const { id, startDate, endDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        const chartRow = state.data[id] as ChartRow;
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
      const row = state.data[id];
      if (row && row.rowType === 'Event') {
        const eventRow = row as EventRow;
        if (eventRow.eventData[eventIndex]) {
          eventRow.eventData[eventIndex].eachDisplayName = displayName;
        }
      }
    },
    updateEventRow: (state, action: PayloadAction<{ id: string; updatedEventRow: EventRow }>) => {
      state.isFixedData = false;
      const { id, updatedEventRow } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Event') {
        state.data[id] = updatedEventRow;
      }
    },
    updateRegularHolidaySetting: (state, action: PayloadAction<RegularHolidaySetting[]>) => {
      const regularHolidaySetting = action.payload;
      state.regularHolidaySetting = regularHolidaySetting;
      state.regularHolidays = Array.from(new Set(regularHolidaySetting.flatMap(setting => setting.days)));
      resetEndDate(state)
    },
    setIsFixedData: (state, action: PayloadAction<boolean>) => {
      state.isFixedData = action.payload;
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
      if (state.past.length > 30) {
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
        }
      }
    },
  },
});

export const {
  simpleSetData,
  setPlannedStartDate,
  setPlannedEndDate,
  setPlannedStartAndEndDate,
  setActualStartDate,
  setActualEndDate,
  setActualStartAndEndDate,
  setDisplayName,
  setHolidays,
  setEventDisplayName,
  updateEventRow,
  updateRegularHolidaySetting,
  setIsFixedData,
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