// utils/wbsHelpers.ts
import { v4 as uuidv4 } from 'uuid';
import { WBSData } from '../../../types/DataTypes';
import { parse, format } from 'date-fns';
import { DateFormatType } from '../../../reduxStoreAndSlices/store';

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
  text: new Map<string, string>(),
  longFormat: new Map<string, string>(),
  shortFormat: new Map<string, string>()
};

export function standardizeShortDateFormat(dateStr: string, dateFormat: DateFormatType) {
  if (dateCache.shortFormat.has(dateStr)) {
    return dateCache.shortFormat.get(dateStr);
  }
  const formatMap = {
    'yyyy/MM/dd': 'M/d',
    'MM/dd/yyyy': 'M/d',
    'dd/MM/yyyy': 'd/M',
  };

  const targetFormat = formatMap[dateFormat];
  let result = dateStr;

  const parsedDate = parse(dateStr, 'yyyy/MM/dd', new Date());
  if (!isNaN(parsedDate.getTime())) {
    result = format(parsedDate, targetFormat);
  }

  dateCache.shortFormat.set(`${dateFormat}${dateStr}`, result);
  return result;
}

export function standardizeLongDateFormatText(dateStr: string, dateFormat: DateFormatType) {
  if (dateCache.text.has(dateStr)) {
    return dateCache.text.get(dateStr);
  }

  const formatMap = {
    'yyyy/MM/dd': ['yyyy/M/d', 'yyyy-M-d'],
    'MM/dd/yyyy': ['M/d/yyyy', 'M-d-yyyy'],
    'dd/MM/yyyy': ['d/M/yyyy', 'd-M-yyyy']
  };
  const targetFormats = formatMap[dateFormat] || [];
  let result = dateStr;

  for (const fmt of targetFormats) {
    try {
      const parsedDate = parse(dateStr, fmt, new Date());
      if (!isNaN(parsedDate.getTime())) {
        result = format(parsedDate, 'yyyy/M/d');
        break;
      }
    } catch (e) {
      result = '';
      continue;
    }
  }

  dateCache.text.set(`${dateFormat}${dateStr}`, result);
  return result;
}

export function standardizeLongDateFormat(dateStr: string, dateFormat: DateFormatType) {
  if (dateCache.longFormat.has(dateStr)) {
    return dateCache.longFormat.get(dateStr);
  }
  const formatMap = {
    'yyyy/MM/dd': 'yyyy/M/d',
    'MM/dd/yyyy': 'M/d/yyyy',
    'dd/MM/yyyy': 'd/M/yyyy'
  };
  const targetFormat = formatMap[dateFormat];
  let result = dateStr;

  const parsedDate = parse(dateStr, 'yyyy/mm/dd', new Date());
  if (!isNaN(parsedDate.getTime())) {
    result = format(parsedDate, targetFormat);
  }

  dateCache.longFormat.set(`${dateFormat}${dateStr}`, result);
  return result;
}