// CalendarUtils.ts
export const generateDates = (start: Date, end: Date): Date[] => {
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }

  const dateArray: Date[] = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const adjustedDate = new Date(currentDate);
    adjustedDate.setHours(0, 0, 0, 0);
    dateArray.push(adjustedDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
};

export const toLocalISOString = (date: Date): string => {
  if (isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);

  return adjustedDate.toISOString().split('T')[0];
};

const getStartOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const calculateBusinessDays = (start: Date, end: Date, holidays: string[], isIncludeHolidays: boolean): number => {
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }
  let count = 0;
  const currentDate = new Date(getStartOfDay(start));

  while (currentDate <= getStartOfDay(end)) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && (!isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};

export const isHoliday = (date: Date, holidays: string[]): boolean => {
  const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return holidays.includes(dateString);
};

export const addBusinessDays = (start: Date, days: number | null, holidays: string[], isIncludeHolidays: boolean, includeStartDay: boolean = true): Date => {
  if (isNaN(start.getTime()) || days === null || days < 0) {
    return new Date(NaN);
  }
  const currentDate = new Date(start);
  let addedDays = 0;

  const startDayOfWeek = currentDate.getDay();

  if (includeStartDay) {
    if (startDayOfWeek !== 0 && startDayOfWeek !== 6 && !isHoliday(currentDate, holidays) || isIncludeHolidays) {
      addedDays = 1;
    }
  }

  while (addedDays < days) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(currentDate, holidays) || isIncludeHolidays) {
      addedDays++;
    }
  }

  return currentDate;
};