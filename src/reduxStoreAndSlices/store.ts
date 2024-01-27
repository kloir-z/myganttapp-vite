import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WBSData, ChartRow, EventRow } from '../types/DataTypes';
import { testData } from '../testdata/testdata';
import { v4 as uuidv4 } from 'uuid';
import { calculateBusinessDays, addBusinessDays, toLocalISOString } from '../components/Chart/utils/CalendarUtil';
import defaultHolidays from '../defaultSetting/defaultHolidays';
import copiedRowsReducer from './copiedRowsSlice';
import colorReducer from './colorSlice'
import undoable from 'redux-undo';

const assignIds = (data: WBSData[], holidays: string[]): { [id: string]: WBSData } => {
  const dataWithIdsAndNos: { [id: string]: WBSData } = {};
  data.forEach((row, index) => {
    const id = uuidv4();
    if (row.rowType === 'Chart') {
      const chartRow = row as ChartRow;
      const startDate = new Date(chartRow.plannedStartDate);
      const endDate = new Date(chartRow.plannedEndDate);
      const businessDays = calculateBusinessDays(startDate, endDate, holidays);
      dataWithIdsAndNos[id] = { ...chartRow, id, no: index + 1, businessDays };
    } else {
      dataWithIdsAndNos[id] = { ...row, id, no: index + 1 };
    }
  });
  return dataWithIdsAndNos;
};

const initialState: { data: { [id: string]: WBSData }, holidays: string[] } = {
  data: assignIds(testData, []),
  holidays: defaultHolidays
};

const updateDependentRows = (
  state: { data: { [id: string]: WBSData }, holidays: string[] },
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
            // オフセット日数を取得し、依存元の終了日に加算
            let offsetDays = parseInt(dependencyParts[2], 10);
            // offsetDays が NaN または 0 以下の場合、1 に設定
            if (isNaN(offsetDays) || offsetDays <= 0) {
              offsetDays = 1;
            }
            newStartDate = addBusinessDays(newEndDate, offsetDays, state.holidays, false); 
            break;
          }
          case 'sameas': {
            // 依存元の開始日と一致させる
            const dependentRow = state.data[currentId] as ChartRow;
            newStartDate = new Date(dependentRow.plannedStartDate);
            break;
          }
          default:
            // 未知の依存関係タイプの場合は何もしない
            return;
        }

        chartRow.plannedStartDate = toLocalISOString(newStartDate);
        const dependentEndDate = addBusinessDays(newStartDate, chartRow.businessDays, state.holidays);
        chartRow.plannedEndDate = toLocalISOString(dependentEndDate);

        // 依存関係の更新を再帰的に行う
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
  state: { data: { [id: string]: WBSData }, holidays: string[] },
  affectedHolidays: string[]
) => {
  Object.keys(state.data).forEach(id => {
    const row = state.data[id];
    if (row.rowType === 'Chart') {
      const chartRow = row as ChartRow;
      const startDate = new Date(chartRow.plannedStartDate);
      const endDate = new Date(chartRow.plannedEndDate);
      
      if (affectedHolidays.some(holiday => isDateInRange(holiday, startDate, endDate))) {
        const dependentEndDate = addBusinessDays(startDate, chartRow.businessDays, state.holidays);
        state.data[id] = {
          ...chartRow,
          plannedEndDate: toLocalISOString(dependentEndDate)
        };
        updateDependentRows(state, id, dependentEndDate);
      }
    }
  });
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
      state.data = updatedData;
      Object.keys(state.data).forEach(id => {
        const row = state.data[id];
        if (row.rowType === 'Chart') {
          const chartRow = row as ChartRow;
          if (chartRow.plannedEndDate) {
            const newEndDate = new Date(chartRow.plannedEndDate);
            updateDependentRows(state, id, newEndDate);
          }
        }
      });
    },
    setData: (state, action: PayloadAction<{ [id: string]: WBSData }>) => {
      const newData = action.payload;
    
      Object.keys(newData).forEach(id => {
        const newRow = newData[id];
        if (newRow.rowType === 'Chart') {
          const newChartRow = newRow as ChartRow;
          const oldChartRow = state.data[id] as ChartRow;
          const updatedChartRow = { ...oldChartRow, ...newChartRow };
          if (newChartRow.plannedStartDate !== oldChartRow.plannedStartDate) {
            updatedChartRow.plannedStartDate = newChartRow.plannedStartDate;
            if (newChartRow.plannedEndDate) {
              const newStartDate = new Date(newChartRow.plannedStartDate);
              const endDate = new Date(newChartRow.plannedEndDate);
              updatedChartRow.businessDays = calculateBusinessDays(newStartDate, endDate, state.holidays);
            }
          }
          if (newChartRow.plannedEndDate !== oldChartRow.plannedEndDate) {
            updatedChartRow.plannedEndDate = newChartRow.plannedEndDate;
            if (newChartRow.plannedStartDate) {
              const startDate = new Date(newChartRow.plannedStartDate);
              const newEndDate = new Date(newChartRow.plannedEndDate);
              updatedChartRow.businessDays = calculateBusinessDays(startDate, newEndDate, state.holidays);
              updateDependentRows(state, id, newEndDate);
            }
          }
          if (newChartRow.businessDays !== oldChartRow.businessDays) {
            updatedChartRow.businessDays = newChartRow.businessDays;
            if (newChartRow.plannedStartDate && newChartRow.businessDays) {
              const startDate = new Date(newChartRow.plannedStartDate);
              const businessDays = newChartRow.businessDays;
              const newEndDate = addBusinessDays(startDate, businessDays, state.holidays);
              updatedChartRow.plannedEndDate = toLocalISOString(newEndDate);
              updateDependentRows(state, id, newEndDate);
            } else if (newChartRow.plannedStartDate) {
              const startDate = new Date(newChartRow.plannedStartDate);
              const businessDays = 1;
              updatedChartRow.businessDays = 1;
              const newEndDate = addBusinessDays(startDate, businessDays, state.holidays);
              updatedChartRow.plannedEndDate = toLocalISOString(newEndDate);
              updateDependentRows(state, id, newEndDate);
            }
          }
          state.data[id] = updatedChartRow;
        } else {
          state.data[id] = newRow;
        }
      });
      Object.keys(state.data).forEach(id => {
        const row = state.data[id];
        if (row.rowType === 'Chart') {
          const chartRow = row as ChartRow;
          if (chartRow.plannedEndDate) {
            const newEndDate = new Date(chartRow.plannedEndDate);
            updateDependentRows(state, id, newEndDate);
          }
        }
      });
    },
    setPlannedStartDate: (state, action: PayloadAction<{ id: string; startDate: string }>) => {
      const { id, startDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        const chartRow = state.data[id] as ChartRow;
        chartRow.plannedStartDate = startDate;
        if (chartRow.plannedEndDate) {
          const newStartDate = new Date(startDate);
          const endDate = new Date(chartRow.plannedEndDate);
          chartRow.businessDays = calculateBusinessDays(newStartDate, endDate, state.holidays);
        }
      }
    },
    setPlannedEndDate: (state, action: PayloadAction<{ id: string; endDate: string }>) => {
      const { id, endDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        const chartRow = state.data[id] as ChartRow;
        chartRow.plannedEndDate = endDate;
        if (chartRow.plannedStartDate) {
          const startDate = new Date(chartRow.plannedStartDate);
          const newEndDate = new Date(endDate);
          chartRow.businessDays = calculateBusinessDays(startDate, newEndDate, state.holidays);
        }
        updateDependentRows(state, id, new Date(endDate));
      }
    },
    setPlannedStartAndEndDate: (state, action: PayloadAction<{ id: string; startDate: string; endDate: string }>) => {
      const { id, startDate, endDate } = action.payload;
      if (state.data[id] && state.data[id].rowType === 'Chart') {
        const chartRow = state.data[id] as ChartRow;
        chartRow.plannedStartDate = startDate;
        chartRow.plannedEndDate = endDate;
        
        // 新しい開始日と終了日を基に営業日数を計算
        if (startDate && endDate) {
          const newStartDate = new Date(startDate);
          const newEndDate = new Date(endDate);
          chartRow.businessDays = calculateBusinessDays(newStartDate, newEndDate, state.holidays);
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
  },
});

export const {
  simpleSetData,
  setData, 
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
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;