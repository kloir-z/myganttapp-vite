// CalendarUtils.ts

const parseHolidays = (holidays: string[]): Date[] => {
  return holidays.map(holiday => {
    const [year, month, day] = holiday.split('-').map(Number);
    return new Date(year, month - 1, day);
  });
};

export const isHoliday = (date: Date, holidays: string[]): boolean => {
  const holidayDates = parseHolidays(holidays);

  if (isNaN(date.getTime())) {
    return false;
  }

  return holidayDates.some(holiday =>
    holiday.getFullYear() === date.getFullYear() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === date.getDate()
  );
};

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

const getStartOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const calculateBusinessDays = (start: Date, end: Date, holidays: string[]): number => {
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }
  let count = 0;
  const currentDate = new Date(getStartOfDay(start));

  while (currentDate <= getStartOfDay(end)) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(currentDate, holidays)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};

export const addBusinessDays = (start: Date, days: number | null, holidays: string[], includeStartDay: boolean = true): Date => {
  if (isNaN(start.getTime()) || days === null || days < 0) {
    return new Date(NaN);
  }
  const currentDate = new Date(start);
  let addedDays = 0;

  const startDayOfWeek = currentDate.getDay();

  if (includeStartDay) {
    if (startDayOfWeek !== 0 && startDayOfWeek !== 6 && !isHoliday(currentDate, holidays)) {
      addedDays = 1;
    }
  }

  while (addedDays < days) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(currentDate, holidays)) {
      addedDays++;
    }
  }

  return currentDate;
};

export const toLocalISOString = (date: Date): string => {
  if (isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);

  return adjustedDate.toISOString().split('T')[0];
};
