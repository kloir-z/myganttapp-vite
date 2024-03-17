// gridHandlers.ts
import { CellChange, TextCell, NumberCell, CheckboxCell, EmailCell, DropdownCell, ChevronCell, HeaderCell, TimeCell, DateCell } from "@silevis/reactgrid";
import { WBSData, ChartRow, isChartRow, isEventRow, isSeparatorRow } from '../../../types/DataTypes';
import { Dispatch } from 'redux';
import { simpleSetData, ExtendedColumn } from '../../../reduxStoreAndSlices/store';
import { CustomDateCell } from './CustomDateCell';
import { CustomTextCell } from "./CustomTextCell";
import { calculatePlannedDays, addPlannedDays } from "../../Chart/utils/CalendarUtil";

type AllCellTypes = TextCell | NumberCell | CheckboxCell | EmailCell | DropdownCell | ChevronCell | HeaderCell | TimeCell | DateCell | CustomDateCell | CustomTextCell;

export const handleGridChanges = (dispatch: Dispatch, data: { [id: string]: WBSData }, changes: CellChange<AllCellTypes>[], columns: ExtendedColumn[], holidays: string[], regularDaysOffs: number[]) => {
  const updatedData = { ...data };
  const visibleColumns = columns.filter(column => column.visible);
  const secondVisibleColumnId = visibleColumns.length > 1 ? visibleColumns[1].columnId : null;

  changes.forEach((change) => {
    const rowId = change.rowId.toString();
    const rowData = updatedData[rowId];

    if (isSeparatorRow(rowData) && change.columnId === secondVisibleColumnId) {
      const newCell = change.newCell;

      if (newCell.type === 'customText') {
        const customTextCell = newCell as CustomTextCell;
        updatedData[rowId] = {
          ...rowData,
          displayName: customTextCell.text.trim()
        };
      }
    }

    if (isEventRow(rowData)) {
      const fieldName = change.columnId;
      const newCell = change.newCell;

      if (newCell.type === 'customDate') {
        const customDateCell = newCell as CustomDateCell;
        updatedData[rowId] = {
          ...rowData,
          [fieldName]: customDateCell.text
        };
      } else if (newCell.type === 'customText') {
        const customTextCell = newCell as CustomTextCell;
        updatedData[rowId] = {
          ...rowData,
          [fieldName]: customTextCell.text.trim()
        };
      }
    }

    if (isChartRow(rowData)) {
      const chartRow = rowData;
      const fieldName = change.columnId as keyof ChartRow;
      const newCell = change.newCell;

      if (fieldName === "actualStartDate" || fieldName === "actualEndDate") {
        const customDateCell = newCell as CustomDateCell;
        updatedData[rowId] = {
          ...rowData,
          [fieldName]: customDateCell.text
        };
      } else if (fieldName === "plannedStartDate") {
        const customDateCell = newCell as CustomDateCell;
        const startDate = customDateCell.text
        const endDate = chartRow.plannedEndDate
        updatedData[rowId] = {
          ...rowData,
          plannedStartDate: customDateCell.text,
          plannedDays: calculatePlannedDays(startDate, endDate, holidays, chartRow.isIncludeHolidays, regularDaysOffs)
        };
      } else if (fieldName === "plannedEndDate") {
        const customDateCell = newCell as CustomDateCell;
        const startDate = chartRow.plannedStartDate
        const endDate = customDateCell.text
        updatedData[rowId] = {
          ...rowData,
          plannedEndDate: customDateCell.text,
          plannedDays: calculatePlannedDays(startDate, endDate, holidays, chartRow.isIncludeHolidays, regularDaysOffs)
        };
      } else if (fieldName === "plannedDays") {
        const customTextCell = newCell as CustomTextCell;
        const plannedDays = Math.min(parseInt(customTextCell.text, 10), 9999);
        const startDate = chartRow.plannedStartDate
        updatedData[rowId] = {
          ...rowData,
          plannedEndDate: addPlannedDays(startDate, plannedDays, holidays, chartRow.isIncludeHolidays, true, regularDaysOffs),
          plannedDays: plannedDays
        };
      } else if (newCell.type === 'customText') {
        const customTextCell = newCell as CustomTextCell;
        updatedData[rowId] = {
          ...rowData,
          [fieldName]: customTextCell.text.trim()
        };
      } else if (fieldName === "isIncludeHolidays" && newCell.type === 'checkbox') {
        const checkboxCell = newCell as CheckboxCell;
        const startDate = chartRow.plannedStartDate
        updatedData[rowId] = {
          ...rowData,
          isIncludeHolidays: checkboxCell.checked,
          plannedEndDate: addPlannedDays(startDate, chartRow.plannedDays, holidays, checkboxCell.checked, true, regularDaysOffs),
        };
      }
    }
  });

  dispatch(simpleSetData(updatedData));
};