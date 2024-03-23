// CalendarUtils.ts
import { cdate } from "cdate";
import { ChartRow, SeparatorRow, WBSData, isChartRow, isEventRow, isSeparatorRow } from "../types/DataTypes";

export const generateDates = (start: string, end: string): ReturnType<typeof cdate>[] => {
  const startDate = cdate(start);
  const endDate = cdate(end);
  if (+startDate.toDate() > +endDate.toDate()) {
    return [];
  }
  const dateArray: ReturnType<typeof cdate>[] = [];
  let currentDate = startDate;
  while (+currentDate.toDate() <= +endDate.toDate()) {
    dateArray.push(currentDate);
    currentDate = currentDate.add(1, 'day');
  }
  return dateArray;
};

const isRegularDaysOff = (dayOfWeek: number, regularDaysOff: number[]): boolean => {
  return regularDaysOff.includes(dayOfWeek);
};

export const isHoliday = (date: cdate.CDate, holidays: string[]): boolean => {
  const dateString = date.format("YYYY/MM/DD");
  return holidays.includes(dateString);
};

export const calculatePlannedDays = (startString: string, endString: string, holidays: string[], isIncludeHolidays: boolean, regularDaysOff: number[]): number => {
  const start = cdate(startString);
  const end = cdate(endString);
  if (+start > +end) {
    return 0;
  }
  let count = 0;
  let currentDate = start.startOf('day');
  while (+currentDate <= +end.startOf('day')) {
    const dayOfWeek = currentDate.toDate().getDay();
    if ((!isRegularDaysOff(dayOfWeek, regularDaysOff) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      count++;
    }
    currentDate = currentDate.add(1, 'day');
  }
  return count;
};

export const addPlannedDays = (startString: string, days: number | null, holidays: string[], isIncludeHolidays: boolean, includeStartDay: boolean = true, regularDaysOff: number[]): string => {
  if (days === null || days < 0 || startString === '') {
    return '';
  }
  let currentDate = cdate(startString);
  let addedDays = 0;
  if (includeStartDay) {
    const startDayOfWeek = currentDate.toDate().getDay();
    if ((!isRegularDaysOff(startDayOfWeek, regularDaysOff) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      addedDays = 1;
    }
  }
  while (addedDays < days) {
    currentDate = currentDate.add(1, 'day');
    const dayOfWeek = currentDate.toDate().getDay();
    if ((!isRegularDaysOff(dayOfWeek, regularDaysOff) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      addedDays++;
    }
  }
  return currentDate.format("YYYY/MM/DD");
};

const subtractPlannedDays = (endString: string, days: number | null, holidays: string[], isIncludeHolidays: boolean, includeStartDay: boolean = true, regularDaysOff: number[]): string => {
  if (days === null || days < 0 || endString === '') {
    return '';
  }
  let currentDate = cdate(endString);
  let subtractedDays = 0;
  if (includeStartDay) {
    const endDayOfWeek = currentDate.toDate().getDay();
    if ((!isRegularDaysOff(endDayOfWeek, regularDaysOff) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      subtractedDays = 1;
    }
  }
  while (subtractedDays < days) {
    currentDate = currentDate.add(-1, 'day');
    const dayOfWeek = currentDate.toDate().getDay();
    if ((!isRegularDaysOff(dayOfWeek, regularDaysOff) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      subtractedDays++;
    }
  }
  return currentDate.format("YYYY/MM/DD");
};

interface CalculateDependenciesParams {
  currentDependency: string;
  plannedDays: number;
  isIncludeHolidays: boolean;
  baseDate: string;
  calculationDirection: 'back' | 'forward';
  stateHolidays: string[];
  stateRegularDaysOff: number[];
}

function calculateDependencies({ currentDependency, plannedDays, isIncludeHolidays, baseDate, calculationDirection, stateHolidays, stateRegularDaysOff }: CalculateDependenciesParams): { startDate: string; endDate: string } {
  const dependencyParts = currentDependency.toLowerCase().trim().split(',');
  let startDateCdate;
  let endDateCdate;
  switch (dependencyParts[0].trim()) {
    case 'after': {
      let offsetDays = parseInt(dependencyParts[2], 10);
      if (isNaN(offsetDays) || offsetDays <= 0) {
        offsetDays = 1;
      }
      if (calculationDirection === 'back') {
        const includeStartDay = false;
        endDateCdate = subtractPlannedDays(baseDate, offsetDays, stateHolidays, isIncludeHolidays, includeStartDay, stateRegularDaysOff);
        startDateCdate = subtractPlannedDays(endDateCdate, plannedDays, stateHolidays, isIncludeHolidays, !includeStartDay, stateRegularDaysOff);
      } else { // if (calculationDirection === 'forward')
        const includeStartDay = false;
        startDateCdate = addPlannedDays(baseDate, offsetDays, stateHolidays, isIncludeHolidays, includeStartDay, stateRegularDaysOff);
        endDateCdate = addPlannedDays(startDateCdate, plannedDays, stateHolidays, isIncludeHolidays, !includeStartDay, stateRegularDaysOff);
      }
      break;
    }
    case 'sameas': {
      startDateCdate = baseDate;
      const includeStartDay = true;
      endDateCdate = addPlannedDays(baseDate, plannedDays, stateHolidays, isIncludeHolidays, includeStartDay, stateRegularDaysOff);
      break;
    }
    default:
      throw new Error('Unsupported dependency type');
  }
  return {
    startDate: startDateCdate,
    endDate: endDateCdate
  };
}

export const adjustColorOpacity = (color: string): string => {
  const opacityDecrease = 0.5;
  if (/^#/.test(color)) {
    let opacity;
    if (color.length === 9) {
      opacity = parseInt(color.substring(7, 9), 16) / 255;
      opacity = Math.max(0.04, opacity - opacityDecrease);
      const newOpacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
      return color.substring(0, 7) + newOpacityHex;
    } else if (color.length === 7) {
      opacity = 1 - opacityDecrease;
      opacity = Math.max(0.04, opacity);
      const newOpacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
      return color + newOpacityHex;
    }
  }
  else if (/^rgba/.test(color)) {
    const rgbaMatch = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (rgbaMatch) {
      let opacity = parseFloat(rgbaMatch[4]);
      opacity = Math.max(0.04, opacity - opacityDecrease);
      return `rgba(${rgbaMatch[1]},${rgbaMatch[2]},${rgbaMatch[3]},${opacity})`;
    }
  }
  return color;
};


export function buildDependencyMap(data: { [id: string]: WBSData }) {
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

export const updateDependentRows = (
  state: {
    data: { [id: string]: WBSData },
    holidays: string[],
    regularDaysOff: number[],
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
        const dependencyFirstSegment = currentRow.dependency.split(',')[0].toLowerCase().trim();
        if (dependencyFirstSegment === 'after' || dependencyFirstSegment === 'sameas') {
          const baseDate = newStartDate;
          const params: CalculateDependenciesParams = {
            currentDependency: currentRow.dependency,
            plannedDays: chartRow.plannedDays || 1,
            isIncludeHolidays: chartRow.isIncludeHolidays,
            baseDate: baseDate,
            calculationDirection: 'back',
            stateHolidays: state.holidays,
            stateRegularDaysOff: state.regularDaysOff,
          };
          const result = calculateDependencies(params);
          const updatedChartRow = {
            ...chartRow,
            plannedStartDate: result.startDate,
            plannedEndDate: result.endDate,
          };
          state.data[currentDependentId] = updatedChartRow;
          updateDependentRows(state, chartRow.id, result.startDate, result.endDate, visited);
        }
      }
    }
  }
  const dependentRows = state.dependencyMap[currentId];
  if (dependentRows) {
    dependentRows.forEach((dependentRowId) => {
      const chartRow = state.data[dependentRowId];
      if (!visited.has(chartRow.id) && isChartRow(chartRow)) {
        const baseDate = chartRow.dependency.startsWith('sameas') ? newStartDate : newEndDate;
        const dependencyFirstSegment = chartRow.dependency.split(',')[0].toLowerCase().trim();
        if (dependencyFirstSegment === 'after' || dependencyFirstSegment === 'sameas') {
          const params: CalculateDependenciesParams = {
            currentDependency: chartRow.dependency,
            plannedDays: chartRow.plannedDays || 1,
            isIncludeHolidays: chartRow.isIncludeHolidays,
            baseDate: baseDate,
            calculationDirection: chartRow.dependency.startsWith('sameas') ? 'back' : 'forward',
            stateHolidays: state.holidays,
            stateRegularDaysOff: state.regularDaysOff,
          };
          const result = calculateDependencies(params);
          const updatedChartRow = {
            ...chartRow,
            plannedStartDate: result.startDate,
            plannedEndDate: result.endDate,
          };
          state.data[dependentRowId] = updatedChartRow;
          updateDependentRows(state, chartRow.id, result.startDate, result.endDate, visited);
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

export const resetEndDate = (
  state: {
    data: { [id: string]: WBSData },
    holidays: string[],
    regularDaysOff: number[],
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
        const dependentEndDate = addPlannedDays(startDate, chartRow.plannedDays, state.holidays, chartRow.isIncludeHolidays, includeStartDay, state.regularDaysOff);
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

export function validateRowDates(chartRow: ChartRow) {
  return {
    ...chartRow,
    plannedStartDate: validateDateString(chartRow.plannedStartDate),
    plannedEndDate: validateDateString(chartRow.plannedEndDate),
    actualStartDate: validateDateString(chartRow.actualStartDate),
    actualEndDate: validateDateString(chartRow.actualEndDate),
  };
}

export function updateDependency(chartRow: ChartRow, data: { [id: string]: WBSData }, rowId: string): ChartRow {
  const isUserChanged = chartRow.dependency.endsWith('^^user^^');
  let currentDependency = isUserChanged ? chartRow.dependency.slice(0, -8) : chartRow.dependency;
  const parts = chartRow.dependency.split(',');
  if (parts.length < 2) {
    return { ...chartRow, dependentId: '', dependency: '' };
  }
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
    return {
      ...chartRow,
      dependency: currentDependency,
      dependentId: refRowId,
    };
  } else {
    return {
      ...chartRow,
      dependency: '',
      dependentId: ''
    };
  }
}

export const updateSeparatorRowDates = (data: { [id: string]: WBSData }): { [id: string]: WBSData } => {
  const dataArray: WBSData[] = Object.values(data);
  let updatedData: { [id: string]: WBSData } = {};
  let lastSeparatorIndex = -1;
  dataArray.forEach((row, index) => {
    if (isSeparatorRow(row)) {
      if (lastSeparatorIndex !== -1) {
        const { minStartDate, maxEndDate } = calculateDateRange(dataArray.slice(lastSeparatorIndex + 1, index));
        const updatedSeparatorRow: SeparatorRow = {
          ...dataArray[lastSeparatorIndex] as SeparatorRow,
          minStartDate,
          maxEndDate,
        };
        dataArray[lastSeparatorIndex] = updatedSeparatorRow;
      }
      lastSeparatorIndex = index;
    }
  });
  if (lastSeparatorIndex !== -1) {
    const { minStartDate, maxEndDate } = calculateDateRange(dataArray.slice(lastSeparatorIndex + 1));
    const updatedSeparatorRow: SeparatorRow = {
      ...dataArray[lastSeparatorIndex] as SeparatorRow,
      minStartDate,
      maxEndDate,
    };
    dataArray[lastSeparatorIndex] = updatedSeparatorRow;
  }
  updatedData = dataArray.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {});
  return updatedData;
};

const calculateDateRange = (rows: WBSData[]): { minStartDate?: string; maxEndDate?: string } => {
  let minStartDate: cdate.CDate | undefined;
  let maxEndDate: cdate.CDate | undefined;
  rows.forEach(row => {
    if (isChartRow(row)) {
      if (row.plannedStartDate && row.plannedEndDate) {
        const startDate = cdate(row.plannedStartDate);
        const endDate = cdate(row.plannedEndDate);
        if (!minStartDate || +startDate < +minStartDate) {
          minStartDate = startDate;
        }
        if (!maxEndDate || +endDate > +maxEndDate) {
          maxEndDate = endDate;
        }
      }
    } else if (isEventRow(row)) {
      row.eventData.forEach(event => {
        if (event.startDate && event.endDate) {
          const startDate = cdate(event.startDate);
          const endDate = cdate(event.endDate);
          if (!minStartDate || +startDate < +minStartDate) {
            minStartDate = startDate;
          }
          if (!maxEndDate || +endDate > +maxEndDate) {
            maxEndDate = endDate;
          }
        }
      });
    }
  });
  return {
    minStartDate: minStartDate ? minStartDate.format('YYYY-MM-DD') : '',
    maxEndDate: maxEndDate ? maxEndDate.format('YYYY-MM-DD') : '',
  };
};
