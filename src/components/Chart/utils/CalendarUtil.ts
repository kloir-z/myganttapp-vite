// CalendarUtils.ts

export const generateDates = (start: string, end: string): Date[] => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || start > end) {
    return [];
  }

  const dateArray: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
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

  return adjustedDate.toISOString().split('T')[0].replace(/-/g, '/');
};

const getStartOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const isRegularHoliday = (dayOfWeek: number, regularHolidays: number[]): boolean => {
  return regularHolidays.includes(dayOfWeek);
};

export const isHoliday = (date: Date, holidays: string[]): boolean => {
  const dateString = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  return holidays.includes(dateString);
};

export const calculatePlannedDays = (start: Date, end: Date, holidays: string[], isIncludeHolidays: boolean, regularHolidays: number[]): number => {
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }
  let count = 0;
  const currentDate = new Date(getStartOfDay(start));

  while (currentDate <= getStartOfDay(end)) {
    const dayOfWeek = currentDate.getDay();
    if ((!isRegularHoliday(dayOfWeek, regularHolidays) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};

export const addPlannedDays = (start: Date, days: number | null, holidays: string[], isIncludeHolidays: boolean, includeStartDay: boolean = true, regularHolidays: number[]): Date => {
  if (isNaN(start.getTime()) || days === null || days < 0) {
    return new Date(NaN);
  }
  const currentDate = new Date(start);
  let addedDays = 0;

  if (includeStartDay) {
    const startDayOfWeek = currentDate.getDay();
    if ((!isRegularHoliday(startDayOfWeek, regularHolidays) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      addedDays = 1;
    }
  }

  while (addedDays < days) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    if ((!isRegularHoliday(dayOfWeek, regularHolidays) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      addedDays++;
    }
  }

  return currentDate;
};

export const subtractPlannedDays = (end: Date, days: number | null, holidays: string[], isIncludeHolidays: boolean, includeStartDay: boolean = true, regularHolidays: number[]): Date => {
  if (isNaN(end.getTime()) || days === null || days < 0) {
    return new Date(NaN);
  }
  const currentDate = new Date(end);
  let subtractedDays = 0;

  if (includeStartDay) {
    const endDayOfWeek = currentDate.getDay();
    if ((!isRegularHoliday(endDayOfWeek, regularHolidays) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      subtractedDays = 1;
    }
  }

  while (subtractedDays < days) {
    currentDate.setDate(currentDate.getDate() - 1);
    const dayOfWeek = currentDate.getDay();
    if ((!isRegularHoliday(dayOfWeek, regularHolidays) && !isHoliday(currentDate, holidays)) || isIncludeHolidays) {
      subtractedDays++;
    }
  }

  return currentDate;
};

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
