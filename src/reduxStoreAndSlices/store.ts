import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WBSData, ChartRow, EventRow, RegularHolidaySetting } from '../types/DataTypes';
import { calculatePlannedDays, addPlannedDays, toLocalISOString, adjustColorOpacity } from '../components/Chart/utils/CalendarUtil';
import copiedRowsReducer from './copiedRowsSlice';
import colorReducer from './colorSlice'
import baseSettingsReducer from './baseSettingsSlice';
import { Column } from "@silevis/reactgrid";
import { initializedEmptyData } from './initialData';
import { initialHolidays } from './initialHolidays';

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
  isFixedData: boolean,
  columns: ExtendedColumn[],
  showYear: boolean,
  past: UndoableState[],
  future: UndoableState[]
} = {
  data: initializedEmptyData,
  holidays: initialHolidays || [],
  regularHolidaySetting: [
    { id: 1, color: '#d9e6ff', subColor: adjustColorOpacity('#d9e6ff'), days: [6] },
    { id: 2, color: '#ffdcdc', subColor: adjustColorOpacity('#ffdcdc'), days: [0] },
    { id: 3, color: '#00000010', subColor: adjustColorOpacity('#00000010'), days: [] },
  ],
  isFixedData: true,
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
  past: [{
    data: initializedEmptyData,
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
    ]
  }],
  future: []
};

const updateDependentRows = (
  state: { data: { [id: string]: WBSData }, holidays: string[], regularHolidaySetting: RegularHolidaySetting[] },
  currentId: string,
  newEndDate: Date,
  visited = new Set<string>()
) => {
  if (visited.has(currentId)) {
    if (state.data[currentId] && state.data[currentId].rowType === 'Chart') {
      const chartRow = state.data[currentId] as ChartRow;
      chartRow.dependentId = '';
    }
    return;
  }
  visited.add(currentId);
  const regularHolidays = Array.from(new Set(state.regularHolidaySetting.flatMap(setting => setting.days)));
  Object.values(state.data).forEach((row: WBSData) => {
    if (row.rowType === 'Chart') {
      const chartRow = row as ChartRow;
      if (chartRow.dependentId === currentId) {
        const dependency = chartRow.dependency.toLowerCase();
        if (!chartRow.dependency) {
          return;
        }
        const dependencyParts = dependency.split(',');

        let newStartDate;
        switch (dependencyParts[0]) {
          case 'after': {
            let offsetDays = parseInt(dependencyParts[2], 10);
            if (isNaN(offsetDays) || offsetDays <= 0) {
              offsetDays = 1;
            }
            const includeStartDay = false
            newStartDate = addPlannedDays(newEndDate, offsetDays, state.holidays, chartRow.isIncludeHolidays, includeStartDay, regularHolidays);
            break;
          }
          case 'sameas': {
            const dependentRow = state.data[currentId] as ChartRow;
            newStartDate = new Date(dependentRow.plannedStartDate);
            break;
          }
          default:
            return;
        }

        chartRow.plannedStartDate = toLocalISOString(newStartDate);
        const includeStartDay = true
        const dependentEndDate = addPlannedDays(newStartDate, chartRow.plannedDays, state.holidays, chartRow.isIncludeHolidays, includeStartDay, regularHolidays);
        chartRow.plannedEndDate = toLocalISOString(dependentEndDate);

        updateDependentRows(state, chartRow.id, dependentEndDate, visited);
      }
    }
  });
};

function isDateInRange(dateString: string, startDate: Date, endDate: Date): boolean {
  const date = new Date(dateString);
  return date >= startDate && date <= endDate;
}

const resetEndDate = (
  state: { data: { [id: string]: WBSData }, holidays: string[], regularHolidaySetting: RegularHolidaySetting[] },
  affectedHolidays?: string[]
) => {
  const regularHolidays = Array.from(new Set(state.regularHolidaySetting.flatMap(setting => setting.days)));
  Object.keys(state.data).forEach(id => {
    const row = state.data[id];
    if (row.rowType === 'Chart') {
      const chartRow = row as ChartRow;
      const startDate = new Date(chartRow.plannedStartDate);
      const endDate = new Date(chartRow.plannedEndDate);
      if (!affectedHolidays || affectedHolidays.some(holiday => isDateInRange(holiday, startDate, endDate))) {
        const includeStartDay = true;
        const dependentEndDate = addPlannedDays(startDate, chartRow.plannedDays, state.holidays, chartRow.isIncludeHolidays, includeStartDay, regularHolidays);
        state.data[id] = {
          ...chartRow,
          plannedEndDate: toLocalISOString(dependentEndDate)
        };
        updateDependentRows(state, id, dependentEndDate);
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
      const regularHolidays = Array.from(new Set(state.regularHolidaySetting.flatMap(setting => setting.days)));
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
      const updateDependentRowsInline = (updatedData: { [id: string]: WBSData }, currentId: string, newEndDate: Date) => {
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
                  newStartDate = addPlannedDays(newEndDate, offsetDays, state.holidays, chartRow.isIncludeHolidays, includeStartDay, regularHolidays);
                  break;
                }
                case 'sameas': {
                  const dependentRow = updatedData[chartRow.dependentId] as ChartRow;
                  newStartDate = new Date(dependentRow.plannedStartDate);
                  break;
                }
                default:
                  return;
              }
              const includeStartDay = true;
              const dependentEndDate = addPlannedDays(newStartDate, chartRow.plannedDays, state.holidays, chartRow.isIncludeHolidays, includeStartDay, regularHolidays);
              const updatedChartRow = {
                ...chartRow,
                plannedStartDate: toLocalISOString(newStartDate),
                plannedEndDate: toLocalISOString(dependentEndDate)
              };
              updatedData[id] = updatedChartRow;
              updateDependentRowsInline(updatedData, id, new Date(dependentEndDate));
            }
          }
        });
      };

      Object.keys(updatedData).forEach(id => {
        const row = updatedData[id];
        if (row.rowType === 'Chart' && row.plannedEndDate) {
          const newEndDate = new Date(row.plannedEndDate);
          updateDependentRowsInline(updatedData, id, newEndDate);
        }
      });

      state.past.push({ data: state.data, columns: state.columns });
      state.future = [];
      state.data = updatedData;
    },
    setPlannedStartDate: (state, action: PayloadAction<{ id: string; startDate: string }>) => {
      state.isFixedData = false;
      const { id, startDate } = action.payload;
      const regularHolidays = Array.from(new Set(state.regularHolidaySetting.flatMap(setting => setting.days)));
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        const chartRow = state.data[id] as ChartRow;
        chartRow.plannedStartDate = startDate;
        if (chartRow.plannedEndDate) {
          const newStartDate = new Date(startDate);
          const endDate = new Date(chartRow.plannedEndDate);
          chartRow.plannedDays = calculatePlannedDays(newStartDate, endDate, state.holidays, chartRow.isIncludeHolidays, regularHolidays);
        }
      }
    },
    setPlannedEndDate: (state, action: PayloadAction<{ id: string; endDate: string }>) => {
      state.isFixedData = false;
      const { id, endDate } = action.payload;
      const regularHolidays = Array.from(new Set(state.regularHolidaySetting.flatMap(setting => setting.days)));
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        const chartRow = state.data[id] as ChartRow;
        chartRow.plannedEndDate = endDate;
        if (chartRow.plannedStartDate) {
          const startDate = new Date(chartRow.plannedStartDate);
          const newEndDate = new Date(endDate);
          chartRow.plannedDays = calculatePlannedDays(startDate, newEndDate, state.holidays, chartRow.isIncludeHolidays, regularHolidays);
        }
        updateDependentRows(state, id, new Date(endDate));
      }
    },
    setPlannedStartAndEndDate: (state, action: PayloadAction<{ id: string; startDate: string; endDate: string }>) => {
      state.isFixedData = false;
      const { id, startDate, endDate } = action.payload;
      const regularHolidays = Array.from(new Set(state.regularHolidaySetting.flatMap(setting => setting.days)));
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        const chartRow = state.data[id] as ChartRow;
        chartRow.plannedStartDate = startDate;
        chartRow.plannedEndDate = endDate;

        if (startDate && endDate) {
          const newStartDate = new Date(startDate);
          const newEndDate = new Date(endDate);
          chartRow.plannedDays = calculatePlannedDays(newStartDate, newEndDate, state.holidays, chartRow.isIncludeHolidays, regularHolidays);
        }
        updateDependentRows(state, id, new Date(endDate));
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
    resetStore(state) {
      Object.assign(state, initialState)
    },
    pushPastState: (state) => {
      state.past.push({ data: state.data, columns: state.columns });
      state.future = [];
    },
    removePastState: (state, action: PayloadAction<number>) => {
      state.past.splice(action.payload, 1);
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