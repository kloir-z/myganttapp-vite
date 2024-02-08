// utils/wbsHelpers.ts
import { v4 as uuidv4 } from 'uuid';
import { WBSData } from '../../../types/DataTypes';
import { parse, format } from 'date-fns';

export const assignIds = (data: WBSData[]): { [id: string]: WBSData } => {
  const dataWithIdsAndNos: { [id: string]: WBSData } = {};
  data.forEach((row, index) => {
    const id = row.id || uuidv4();
    dataWithIdsAndNos[id] = { ...row, id, no: index + 1 };
  });
  return dataWithIdsAndNos;
};

export const reorderArray = <T extends { id: string }>(arr: T[], indexesToMove: number[], newIndex: number): T[] => {
  const itemsToMove = indexesToMove.map(index => arr[index]);
  const remainingItems = arr.filter((_, index) => !indexesToMove.includes(index));
  const maxIndexToMove = Math.max(...indexesToMove);

  if (maxIndexToMove < newIndex) {
    newIndex -= indexesToMove.length - 1;
  }

  if (newIndex > arr.length - indexesToMove.length) {
    newIndex = arr.length - indexesToMove.length;
  } else if (newIndex < 0) {
    newIndex = 0;
  }

  const start = remainingItems.slice(0, newIndex);
  const end = remainingItems.slice(newIndex);

  return [...start, ...itemsToMove, ...end];
};

const dateCache = {
  longFormat: new Map<string, string>(),
  shortFormat: new Map<string, string>()
};

export function standardizeShortDateFormat(dateStr: string) {
  if (dateCache.shortFormat.has(dateStr)) {
    return dateCache.shortFormat.get(dateStr);
  }

  const formats = [
    'yyyy/MM/dd', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy',
    'yy/MM/dd', 'yy-MM-dd', 'M/d/yy', 'd/M/yy'
  ];
  let result = dateStr;

  function getCountryCode(locale: string) {
    return locale.includes('-') ? locale.split('-')[1].toLowerCase() : locale.toLowerCase();
  }

  const browserLocale = navigator.language || 'ja-JP';
  const countryCode = getCountryCode(browserLocale);

  const ddMMYYYYCountries = ['fr', 'de', 'it', 'es', 'pt', 'ru',
    'br', 'ar', 'mx', 'pe', 'za', 'ng',
    'ke', 'in', 'th', 'id', 'au', 'nz'];

  let dateFormat;
  if (ddMMYYYYCountries.includes(countryCode)) {
    dateFormat = 'd/M';
  } else {
    dateFormat = 'M/d';
  }

  for (const fmt of formats) {
    try {
      let parsedDate = parse(dateStr, fmt, new Date());
      if (fmt.includes('yy') && !fmt.includes('yyyy')) {
        parsedDate = adjustCenturyForTwoDigitYear(parsedDate);
      }
      if (!isNaN(parsedDate.getTime())) {
        result = format(parsedDate, dateFormat);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  dateCache.shortFormat.set(dateStr, result);
  return result;
}

export function standardizeLongDateFormat(dateStr: string) {
  if (dateCache.longFormat.has(dateStr)) {
    return dateCache.longFormat.get(dateStr);
  }

  const formats = [
    'yyyy/MM/dd', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy',
    'yy/MM/dd', 'yy-MM-dd', 'M/d/yy', 'd/M/yy'
  ];
  let result = dateStr;

  for (const fmt of formats) {
    try {
      let parsedDate = parse(dateStr, fmt, new Date());
      if (fmt.includes('yy') && !fmt.includes('yyyy')) {
        parsedDate = adjustCenturyForTwoDigitYear(parsedDate);
      }
      if (!isNaN(parsedDate.getTime())) {
        result = format(parsedDate, 'yyyy/M/d');
        break;
      }
    } catch (e) {
      continue;
    }
  }

  dateCache.longFormat.set(dateStr, result);
  return result;
}

function adjustCenturyForTwoDigitYear(date: Date) {
  const currentYear = new Date().getFullYear();
  const twoDigitYear = date.getFullYear() % 100;
  const century = Math.floor(currentYear / 100) * 100;
  return new Date(date.setFullYear(century + twoDigitYear));
}