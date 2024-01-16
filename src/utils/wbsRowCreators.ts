// wbsRowCreators.ts
import { ChartRow, SeparatorRow, EventRow } from '../types/DataTypes';
import { Row, DefaultCellTypes, NumberCell, Column } from "@silevis/reactgrid";
import { CustomDateCell } from './CustomDateCell';
import { CustomTextCell } from './CustomTextCell';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fillEmptyCells = (cells: (NumberCell | CustomTextCell | CustomDateCell)[], columnCount: number, style?: any) => {
  while (cells.length < columnCount) {
    const emptyCell: CustomTextCell = { type: "customText", text: "", value: NaN, style };
    cells.push(emptyCell);
  } 
};

export const createChartRow = (chartRow: ChartRow, columns: Column[]): Row<DefaultCellTypes | CustomTextCell | CustomDateCell> => {
  const rowCells = columns.map(column => {
    const columnId = column.columnId as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cellValue = (chartRow as any)[columnId];
    if (cellValue === null || cellValue === undefined) {
      cellValue = '';
    }
    if (["plannedStartDate", "plannedEndDate", "actualStartDate", "actualEndDate"].includes(columnId)) {
      return { type: "customDate", text: cellValue, value: NaN } as CustomDateCell;
    }
    else if (columnId === "no") {
      return { type: "number", value: cellValue as number, style: { background: 'rgba(128, 128, 128, 0.1)'}} as NumberCell;
    }
    else {
      return { type: "customText", text: cellValue as string, value: NaN } as CustomTextCell;
    }
  });
  return { rowId: chartRow.id, height: 21, cells: rowCells, reorderable: true };
};

export const createEventRow = (eventRow: EventRow, columns: Column[]): Row<DefaultCellTypes | CustomTextCell | CustomDateCell> => {
  const rowCells = columns.map(column => {
    const columnId = column.columnId as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cellValue = (eventRow as any)[columnId];
    if (cellValue === null || cellValue === undefined) {
      cellValue = '';
    }
    if (["plannedStartDate", "plannedEndDate", "actualStartDate", "actualEndDate"].includes(columnId)) {
      return { type: "customDate", text: cellValue, value: NaN } as CustomDateCell;
    }
    else if (columnId === "no") {
      return { type: "number", value: cellValue as number, style: { background: 'rgba(128, 128, 128, 0.1)'}} as NumberCell;
    }
    else {
      return { type: "customText", text: cellValue as string, value: NaN } as CustomTextCell;
    }
  });
  return { rowId: eventRow.id, height: 21, cells: rowCells, reorderable: true };
};

export const createSeparatorRow = (separatorRow: SeparatorRow, columnCount: number): Row<DefaultCellTypes | CustomTextCell> => {
  const rowCells = [
    { type: "number", value: separatorRow.no, isEditing: false, style: { background: 'rgba(128, 128, 128, 0.1)'} } as NumberCell,
    { type: "customText", text: separatorRow.displayName, value: NaN, colspan: 12, style: { background: '#ddedff' } } as CustomTextCell
  ];
  fillEmptyCells(rowCells, columnCount, { background: '#ddedff' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { rowId: separatorRow.id, height: 21, cells: rowCells as any[], reorderable: true };
};