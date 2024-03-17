// CalendarUtils.ts
import { cdate } from "cdate";

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

const isRegularDaysOff = (dayOfWeek: number, regularDaysOffs: number[]): boolean => {
  return regularDaysOffs.includes(dayOfWeek);
};

export const isHoliday = (date: cdate.CDate, holidays: string[]): boolean => {
  const dateString = date.format("YYYY/MM/DD");
  return holidays.includes(dateString);
};

export const calculatePlannedDays = (startString: string, endString: string, holidays: string[], isIncludeHolidays: boolean, regularDaysOffs: number[]): number => {
  const start = cdate(startString);
  const end = cdate(endString);

  if (+start > +end) {
    return 0;
  }
  let count = 0;
  let currentDate = start.startOf('day');

  while (+currentDate <= +end.startOf('day')) {
    const dayOfWeek = currentDate.toDate().getDay();
    if ((!isRegularDaysOff(dayOfWeek, regularDaysOffs) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      count++;
    }
    currentDate = currentDate.add(1, 'day');
  }

  return count;
};

export const addPlannedDays = (startString: string, days: number | null, holidays: string[], isIncludeHolidays: boolean, includeStartDay: boolean = true, regularDaysOffs: number[]): string => {
  if (days === null || days < 0 || startString === '') {
    return '';
  }

  let currentDate = cdate(startString);
  let addedDays = 0;

  if (includeStartDay) {
    const startDayOfWeek = currentDate.toDate().getDay();
    if ((!isRegularDaysOff(startDayOfWeek, regularDaysOffs) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      addedDays = 1;
    }
  }

  while (addedDays < days) {
    currentDate = currentDate.add(1, 'day');
    const dayOfWeek = currentDate.toDate().getDay();
    if ((!isRegularDaysOff(dayOfWeek, regularDaysOffs) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      addedDays++;
    }
  }

  return currentDate.format("YYYY/MM/DD");
};

export const subtractPlannedDays = (endString: string, days: number | null, holidays: string[], isIncludeHolidays: boolean, includeStartDay: boolean = true, regularDaysOffs: number[]): string => {
  if (days === null || days < 0 || endString === '') {
    return '';
  }

  let currentDate = cdate(endString);
  let subtractedDays = 0;

  if (includeStartDay) {
    const endDayOfWeek = currentDate.toDate().getDay();
    if ((!isRegularDaysOff(endDayOfWeek, regularDaysOffs) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      subtractedDays = 1;
    }
  }

  while (subtractedDays < days) {
    currentDate = currentDate.add(-1, 'day'); // Subtract days
    const dayOfWeek = currentDate.toDate().getDay();
    if ((!isRegularDaysOff(dayOfWeek, regularDaysOffs) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      subtractedDays++;
    }
  }

  return currentDate.format("YYYY/MM/DD");
};

export interface CalculateDependenciesParams {
  currentDependency: string;
  plannedDays: number;
  isIncludeHolidays: boolean;
  baseDate: string;
  calculationDirection: 'back' | 'forward';
  stateHolidays: string[];
  stateRegularDaysOffs: number[];
}

export function calculateDependencies({ currentDependency, plannedDays, isIncludeHolidays, baseDate, calculationDirection, stateHolidays, stateRegularDaysOffs }: CalculateDependenciesParams): { startDate: string; endDate: string } {
  const dependencyParts = currentDependency.toLowerCase().split(',');
  let startDateCdate;
  let endDateCdate;

  switch (dependencyParts[0]) {
    case 'after': {
      let offsetDays = parseInt(dependencyParts[2], 10);
      if (isNaN(offsetDays) || offsetDays <= 0) {
        offsetDays = 1;
      }
      if (calculationDirection === 'back') {
        const includeStartDay = false;
        endDateCdate = subtractPlannedDays(baseDate, offsetDays, stateHolidays, isIncludeHolidays, includeStartDay, stateRegularDaysOffs);
        startDateCdate = subtractPlannedDays(endDateCdate, plannedDays, stateHolidays, isIncludeHolidays, !includeStartDay, stateRegularDaysOffs);
      } else { // if (calculationDirection === 'forward')
        const includeStartDay = false;
        startDateCdate = addPlannedDays(baseDate, offsetDays, stateHolidays, isIncludeHolidays, includeStartDay, stateRegularDaysOffs);
        endDateCdate = addPlannedDays(startDateCdate, plannedDays, stateHolidays, isIncludeHolidays, !includeStartDay, stateRegularDaysOffs);
      }
      break;
    }
    case 'sameas': {
      startDateCdate = baseDate;
      const includeStartDay = true;
      endDateCdate = addPlannedDays(baseDate, plannedDays, stateHolidays, isIncludeHolidays, includeStartDay, stateRegularDaysOffs);
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