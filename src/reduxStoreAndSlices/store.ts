import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WBSData, ChartRow, EventRow, RegularHolidaySetting } from '../types/DataTypes';
import { testData } from '../testdata/testdata';
import { calculatePlannedDays, addPlannedDays, toLocalISOString } from '../components/Chart/utils/CalendarUtil';
import copiedRowsReducer from './copiedRowsSlice';
import colorReducer from './colorSlice'
import regularHolidaysReducer from './regularHolidaysSlice';
import undoable from 'redux-undo';
import { assignIds } from '../components/Table/utils/wbsHelpers';

const initialState: { data: {
  [id: string]: WBSData },
  holidays: string[],
  regularHolidaySetting: RegularHolidaySetting[]
} = {
  data: assignIds(testData),
  holidays: [],
  regularHolidaySetting: [
    { id: 1, color: '#d9e6ff', days: [6] },
    { id: 2, color: '#ffdcdc', days: [0] },
    { id: 3, color: '#00000010', days: [] },
  ]
};

const updateDependentRows = (
  state: { data: { [id: string]: WBSData }, holidays: string[], regularHolidaySetting: RegularHolidaySetting[]},
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

      state.data = updatedData;
    },
    setPlannedStartDate: (state, action: PayloadAction<{ id: string; startDate: string }>) => {
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
      const { id, startDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        (state.data[id] as ChartRow).actualStartDate = startDate;
      }
    },
    setActualEndDate: (state, action: PayloadAction<{ id: string; endDate: string }>) => {
      const { id, endDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        (state.data[id] as ChartRow).actualEndDate = endDate;
      }
    },
    setActualStartAndEndDate: (state, action: PayloadAction<{ id: string; startDate: string; endDate: string }>) => {
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
} = wbsDataSlice.actions;

let lastActionTimestamp = Date.now();

const timeBasedFilter = () => {
  const now = Date.now();
  if (now - lastActionTimestamp > 2000) {
    lastActionTimestamp = now;
    return true;
  }
  return false;
};

const undoableOptions = {
  filter: timeBasedFilter
};

export const store = configureStore({
  reducer: {
    wbsData: undoable(wbsDataSlice.reducer, undoableOptions),
    copiedRows: copiedRowsReducer,
    color: colorReducer,  
    regularHolidays: regularHolidaysReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;