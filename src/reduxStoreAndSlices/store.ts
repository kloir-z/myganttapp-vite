import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WBSData, ChartRow, EventRow, RegularDaysOffSetting, isChartRow, isEventRow, isSeparatorRow } from '../types/DataTypes';
import { calculatePlannedDays, addPlannedDays, calculateDependencies, CalculateDependenciesParams } from '../components/Chart/utils/CalendarUtil';
import copiedRowsReducer from './copiedRowsSlice';
import colorReducer from './colorSlice'
import baseSettingsReducer from './baseSettingsSlice';
import { Column } from "@silevis/reactgrid";
import { initializedDummyData, initializedEmptyData } from './initialData';
import { initialHolidays, initialRegularDaysOffSetting } from './initialHolidays';
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
  regularDaysOffSetting: RegularDaysOffSetting[],
  regularDaysOffs: number[],
  isFixedData: boolean,
  columns: ExtendedColumn[],
  showYear: boolean,
  dependencyMap: { [id: string]: string[] },
  past: UndoableState[],
  future: UndoableState[]
} = {
  data: initializedDummyData,
  holidays: initialHolidays,
  regularDaysOffSetting: initialRegularDaysOffSetting,
  regularDaysOffs: Array.from(new Set(initialRegularDaysOffSetting.flatMap(setting => setting.days))),
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
    const chartRow = data[id];
    if (isChartRow(chartRow)) {
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
  state: {
    data: { [id: string]: WBSData },
    holidays: string[],
    regularDaysOffs: number[],
    dependencyMap: { [id: string]: string[] }
  },
  currentId: string,
  newStartDate: string,
  newEndDate: string,
  visited = new Set<string>()
) => {
  if (visited.has(currentId) || newStartDate === '' || newEndDate === '') {
    return;
  }
  visited.add(currentId);
  const currentRow = state.data[currentId]
  if (isChartRow(currentRow)) {
    const currentDependentId = currentRow.dependentId;
    if (currentDependentId && !visited.has(currentDependentId)) {
      const chartRow = state.data[currentDependentId];
      if (isChartRow(chartRow)) {
        const dependency = currentRow.dependency.toLowerCase();
        const baseDate = newStartDate;
        const params: CalculateDependenciesParams = {
          currentDependency: dependency,
          plannedDays: chartRow.plannedDays || 1,
          isIncludeHolidays: chartRow.isIncludeHolidays,
          baseDate: baseDate,
          calculationDirection: 'back',
          stateHolidays: state.holidays,
          stateRegularDaysOffs: state.regularDaysOffs,
        };
        try {
          const result = calculateDependencies(params);
          chartRow.plannedStartDate = result.startDate;
          chartRow.plannedEndDate = result.endDate;
          updateDependentRows(state, chartRow.id, result.startDate, result.endDate, visited);
        } catch (error) {
          console.error("Dependency calculation failed for row ID " + chartRow.id + ": ", error);
        }
      }
    }
  }
  const dependentRows = state.dependencyMap[currentId];
  if (dependentRows) {
    dependentRows.forEach((dependentRowId) => {
      const chartRow = state.data[dependentRowId];
      if (!visited.has(chartRow.id) && isChartRow(chartRow)) {
        const dependency = chartRow.dependency.toLowerCase();
        const baseDate = dependency.startsWith('sameas') ? newStartDate : newEndDate;
        const params: CalculateDependenciesParams = {
          currentDependency: dependency,
          plannedDays: chartRow.plannedDays || 1,
          isIncludeHolidays: chartRow.isIncludeHolidays,
          baseDate: baseDate,
          calculationDirection: dependency.startsWith('sameas') ? 'back' : 'forward',
          stateHolidays: state.holidays,
          stateRegularDaysOffs: state.regularDaysOffs,
        };
        try {
          const result = calculateDependencies(params);
          chartRow.plannedStartDate = result.startDate;
          chartRow.plannedEndDate = result.endDate;
          updateDependentRows(state, chartRow.id, result.startDate, result.endDate, visited);
        } catch (error) {
          console.error("Dependency calculation failed for row ID " + dependentRowId + ": ", error);
        }
      }
    });
  }
};

function isDateInRange(dateString: string, startDateString: string, endDateString: string): boolean {
  const date = cdate(dateString);
  const startDate = cdate(startDateString);
  const endDate = cdate(endDateString);
  return +date >= +startDate && +date <= +endDate;
}

const resetEndDate = (
  state: {
    data: { [id: string]: WBSData },
    holidays: string[],
    regularDaysOffs: number[],
    dependencyMap: { [id: string]: string[] }
  },
  affectedHolidays?: string[]
) => {
  Object.keys(state.data).forEach(id => {
    const chartRow = state.data[id];
    if (isChartRow(chartRow)) {
      const startDate = chartRow.plannedStartDate;
      const endDate = chartRow.plannedEndDate;
      if (!affectedHolidays || affectedHolidays.some(holiday => isDateInRange(holiday, startDate, endDate))) {
        const includeStartDay = true;
        const dependentEndDate = addPlannedDays(startDate, chartRow.plannedDays, state.holidays, chartRow.isIncludeHolidays, includeStartDay, state.regularDaysOffs);
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
  try {
    const dateCDate = cdate(dateString);
    const date = dateCDate.toDate();
    if (isNaN(date.getTime())) return "";
    const startDate = cdate("1970/01/01");
    const endDate = cdate("2099/12/31");
    if (dateCDate < startDate || dateCDate > endDate) {
      return "";
    }
  } catch (e) {
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
        const chartRow = data[rowId];
        if (isChartRow(chartRow)) {
          let updatedRowData = { ...chartRow };

          updatedRowData.plannedStartDate = validateDateString(chartRow.plannedStartDate);
          updatedRowData.plannedEndDate = validateDateString(chartRow.plannedEndDate);
          updatedRowData.actualStartDate = validateDateString(chartRow.actualStartDate);
          updatedRowData.actualEndDate = validateDateString(chartRow.actualEndDate);

          if (chartRow.dependency) {
            const isUserChanged = chartRow.dependency.endsWith('^^user^^');
            let currentDependency = isUserChanged ? chartRow.dependency.slice(0, -8) : chartRow.dependency;
            const parts = chartRow.dependency.split(',');
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
                  if (isChartRow(data[Object.keys(data)[currentIndex]])) {
                    steps--;
                  }
                }
                if (currentIndex >= 0 && currentIndex < Object.keys(data).length) {
                  refRowId = Object.keys(data)[currentIndex];
                } else {
                  refRowId = ''
                  currentDependency = ''
                }
              } else if (refRowNo && chartRow.dependentId && isUserChanged) {
                const targetNo = parseInt(refRowNo, 10);
                refRowId = Object.keys(data).find(key => {
                  const keyRowData = data[key];
                  return isChartRow(keyRowData) && keyRowData.no === targetNo;
                });
              } else if (refRowNo && chartRow.dependentId && !isUserChanged) {
                const matchingRow = Object.entries(data).find(([key, value]) => key === chartRow.dependentId && isChartRow(value)) as [string, ChartRow] | undefined;
                if (matchingRow) {
                  const [, matchingRowData] = matchingRow;
                  parts[1] = matchingRowData.no.toString();
                  refRowId = chartRow.dependentId;
                  currentDependency = parts.join(',');
                }
              } else {
                const targetNo = parseInt(refRowNo, 10);
                refRowId = Object.keys(data).find(key => {
                  const keyRowData = data[key];
                  return isChartRow(keyRowData) && keyRowData.no === targetNo;
                });
              }
              if (refRowId) {
                updatedRowData = {
                  ...chartRow,
                  dependency: currentDependency,
                  dependentId: refRowId,
                };
              } else {
                updatedRowData = {
                  ...chartRow,
                  dependency: '',
                  dependentId: ''
                };
              }
            } else {
              updatedRowData = {
                ...chartRow,
                dependency: '',
                dependentId: ''
              };
            }
          } else {
            updatedRowData = {
              ...chartRow,
              dependentId: '',
              dependency: ''
            };
          }
          acc[rowId] = updatedRowData;
        } else {
          acc[rowId] = chartRow;
        }
        return acc;
      }, {});
      state.dependencyMap = buildDependencyMap(updatedData);

      const visited = new Set<string>();
      const updateDependentRowsInline = (updatedData: { [id: string]: WBSData }, currentId: string, newStartDate: string, newEndDate: string) => {
        if (visited.has(currentId)) {
          return;
        }
        visited.add(currentId);
        const dependentRows = state.dependencyMap[currentId];
        if (dependentRows) {
          dependentRows.forEach((dependentRowId) => {
            const chartRow = updatedData[dependentRowId];
            if (isChartRow(chartRow)) {
              const dependency = chartRow.dependency.toLowerCase();
              if (!dependency) return;
              const baseDate = dependency.startsWith('sameas') ? newStartDate : newEndDate;
              const { startDate: dependentStartDate, endDate: dependentEndDate } = calculateDependencies({
                currentDependency: chartRow.dependency,
                plannedDays: chartRow.plannedDays || 1,
                isIncludeHolidays: chartRow.isIncludeHolidays,
                baseDate: baseDate,
                calculationDirection: 'forward',
                stateHolidays: state.holidays,
                stateRegularDaysOffs: state.regularDaysOffs,
              });
              const updatedChartRow = {
                ...chartRow,
                plannedStartDate: dependentStartDate,
                plannedEndDate: dependentEndDate,
              };
              updatedData[dependentRowId] = updatedChartRow;
              updateDependentRowsInline(updatedData, dependentRowId, dependentStartDate, dependentEndDate);
            }
          });
        }
      }

      Object.keys(updatedData).forEach(id => {
        const row = updatedData[id];
        if (row.rowType === 'Chart' && row.plannedStartDate && row.plannedEndDate) {
          updateDependentRowsInline(updatedData, id, row.plannedStartDate, row.plannedEndDate);
        }
      });

      state.past.push({ data: state.data, columns: state.columns });
      state.future = [];
      if (state.past.length > 30) {
        state.past.shift();
      }
      state.data = updatedData;
    },
    setPlannedStartDate: (state, action: PayloadAction<{ id: string; startDate: string }>) => {
      state.isFixedData = false;
      const { id, startDate } = action.payload;
      const chartRow = state.data[id];
      if (isChartRow(chartRow)) {
        chartRow.plannedStartDate = startDate;
        chartRow.plannedDays = calculatePlannedDays(startDate, chartRow.plannedEndDate, state.holidays, chartRow.isIncludeHolidays, state.regularDaysOffs);
        updateDependentRows(state, id, startDate, chartRow.plannedEndDate);
      }
    },
    setPlannedEndDate: (state, action: PayloadAction<{ id: string; endDate: string }>) => {
      state.isFixedData = false;
      const { id, endDate } = action.payload;
      const chartRow = state.data[id];
      if (isChartRow(chartRow)) {
        chartRow.plannedEndDate = endDate;
        chartRow.plannedDays = calculatePlannedDays(chartRow.plannedStartDate, endDate, state.holidays, chartRow.isIncludeHolidays, state.regularDaysOffs);
        updateDependentRows(state, id, chartRow.plannedStartDate, endDate);
      }
    },
    setPlannedStartAndEndDate: (state, action: PayloadAction<{ id: string; startDate: string; endDate: string }>) => {
      state.isFixedData = false;
      const { id, startDate, endDate } = action.payload;
      const chartRow = state.data[id];
      if (isChartRow(chartRow)) {
        chartRow.plannedStartDate = startDate;
        chartRow.plannedEndDate = endDate;
        chartRow.plannedDays = calculatePlannedDays(startDate, endDate, state.holidays, chartRow.isIncludeHolidays, state.regularDaysOffs);
        updateDependentRows(state, id, startDate, endDate);
      }
    },
    setActualStartDate: (state, action: PayloadAction<{ id: string; startDate: string }>) => {
      state.isFixedData = false;
      const { id, startDate } = action.payload;
      const chartRow = state.data[id];
      if (isChartRow(chartRow)) {
        chartRow.actualStartDate = startDate;
      }
    },
    setActualEndDate: (state, action: PayloadAction<{ id: string; endDate: string }>) => {
      state.isFixedData = false;
      const { id, endDate } = action.payload;
      const chartRow = state.data[id];
      if (isChartRow(chartRow)) {
        chartRow.actualEndDate = endDate;
      }
    },
    setActualStartAndEndDate: (state, action: PayloadAction<{ id: string; startDate: string; endDate: string }>) => {
      state.isFixedData = false;
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
    toggleSeparatorRowExpanded: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      const separatorRow = state.data[id];
      if (isSeparatorRow(separatorRow)) {
        separatorRow.isCollapsed = !separatorRow.isCollapsed
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
      state.isFixedData = false;
      const { id, updatedEventRow } = action.payload;
      state.data[id] = updatedEventRow;
    },
    updateRegularDaysOffSetting: (state, action: PayloadAction<RegularDaysOffSetting[]>) => {
      const regularDaysOffSetting = action.payload;
      state.regularDaysOffSetting = regularDaysOffSetting;
      state.regularDaysOffs = Array.from(new Set(regularDaysOffSetting.flatMap(setting => setting.days)));
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
  simpleSetData,
  setPlannedStartDate,
  setPlannedEndDate,
  setPlannedStartAndEndDate,
  setActualStartDate,
  setActualEndDate,
  setActualStartAndEndDate,
  setDisplayName,
  toggleSeparatorRowExpanded,
  setHolidays,
  setEventDisplayName,
  updateEventRow,
  updateRegularDaysOffSetting,
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