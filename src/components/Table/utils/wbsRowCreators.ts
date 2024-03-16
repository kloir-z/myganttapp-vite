// wbsRowCreators.ts
import { ChartRow, SeparatorRow, EventRow } from '../../../types/DataTypes';
import { Row, DefaultCellTypes, NumberCell, CheckboxCell, Column } from "@silevis/reactgrid";
import { CustomDateCell } from './CustomDateCell';
import { CustomTextCell } from './CustomTextCell';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fillEmptyCells = (cells: (NumberCell | CheckboxCell | CustomTextCell | CustomDateCell)[], columnCount: number, style?: any) => {
  while (cells.length < columnCount) {
    const emptyCell: CustomTextCell = { type: "customText", text: "", value: NaN, style };
    cells.push(emptyCell);
  }
};

export const createChartRow = (chartRow: ChartRow, columns: Column[]): Row<DefaultCellTypes | CustomTextCell | CustomDateCell> => {
  const rowCells: (NumberCell | CustomTextCell | CustomDateCell | CheckboxCell)[] = columns.map(column => {
    const columnId = column.columnId as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cellValue = (chartRow as any)[columnId];
    if (cellValue === null || cellValue === undefined) {
      cellValue = '';
    }
    const columnWidth = column.width || 80;
    if (["plannedStartDate", "plannedEndDate", "actualStartDate", "actualEndDate"].includes(columnId)) {
      return { type: "customDate", text: cellValue, shortDate: '', value: NaN };
    }
    else if (columnId === "no") {
      return { type: "number", value: cellValue, style: { background: 'rgba(128, 128, 128, 0.1)' } };
    }
    else if (columnId === "isIncludeHolidays") {
      if (cellValue === '') {
        cellValue = false;
      }
      return { type: "checkbox", checked: cellValue };
    }
    else {
      return { type: "customText", text: cellValue, value: NaN, columnWidth };
    }
  });
  return { rowId: chartRow.id, height: 21, cells: rowCells, reorderable: true };
};

export const createEventRow = (eventRow: EventRow, columns: Column[]): Row<DefaultCellTypes | CustomTextCell | CustomDateCell> => {
  const rowCells: (NumberCell | CustomTextCell | CustomDateCell)[] = columns.map(column => {
    const columnId = column.columnId as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cellValue = (eventRow as any)[columnId];
    if (cellValue === null || cellValue === undefined) {
      cellValue = '';
    }
    const columnWidth = column.width || 80;
    if (["plannedStartDate", "plannedEndDate", "actualStartDate", "actualEndDate"].includes(columnId)) {
      return { type: "customDate", text: cellValue, shortDate: '', value: NaN, style: { background: 'rgba(128, 128, 128, 0.1)' } };
    }
    else if (columnId === "no") {
      return { type: "number", value: cellValue, style: { background: 'rgba(128, 128, 128, 0.1)' } };
    }
    else {
      return { type: "customText", text: cellValue, value: NaN, columnWidth, style: { background: 'rgba(128, 128, 128, 0.1)' } };
    }
  });
  return { rowId: eventRow.id, height: 21, cells: rowCells, reorderable: true };
};

export const createSeparatorRow = (separatorRow: SeparatorRow, columnCount: number): Row<DefaultCellTypes | CustomTextCell> => {
  const rowCells: (NumberCell | CustomTextCell)[] = [
    { type: "number", value: separatorRow.no, style: { background: 'rgba(128, 128, 128, 0.1)' } },
    { type: "customText", text: separatorRow.displayName, colspan: columnCount - 1, value: NaN, style: { background: '#ddedff' } } as CustomTextCell
  ];
  fillEmptyCells(rowCells, columnCount, { background: '#ddedff' });
  return { rowId: separatorRow.id, height: 21, cells: rowCells, reorderable: true };
};