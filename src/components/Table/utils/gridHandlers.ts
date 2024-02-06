// gridHandlers.ts
import { CellChange, TextCell, NumberCell, CheckboxCell, EmailCell, DropdownCell, ChevronCell, HeaderCell, TimeCell, DateCell } from "@silevis/reactgrid";
import { WBSData, ChartRow, EventRow } from '../../../types/DataTypes';
import { Dispatch } from 'redux';
import { simpleSetData } from '../../../reduxStoreAndSlices/store';
import { CustomDateCell } from './CustomDateCell';
import { CustomTextCell } from "./CustomTextCell";
import { ExtendedColumn } from "../../../reduxStoreAndSlices/baseSettingsSlice";
import { calculatePlannedDays, addPlannedDays, toLocalISOString } from "../../Chart/utils/CalendarUtil";

type AllCellTypes  = TextCell | NumberCell | CheckboxCell | EmailCell | DropdownCell | ChevronCell | HeaderCell | TimeCell | DateCell | CustomDateCell | CustomTextCell;  

export const handleGridChanges = (dispatch: Dispatch, data: { [id: string]: WBSData }, changes: CellChange<AllCellTypes>[], columns: ExtendedColumn[], holidays: string[], regularHolidays: number[]) => {
  const updatedData = { ...data };
  const visibleColumns = columns.filter(column => column.visible);
  const secondVisibleColumnId = visibleColumns.length > 1 ? visibleColumns[1].columnId : null;
  console.log(changes)

  changes.forEach((change) => {
    const rowId = change.rowId.toString();
    const rowData = updatedData[rowId];

    if (rowData && rowData.rowType === 'Separator' && change.columnId === secondVisibleColumnId) {
      const newCell = change.newCell;
      
      if (newCell.type === 'customText') {
        const customTextCell = newCell as CustomTextCell;
        updatedData[rowId] = {
          ...rowData,
          displayName: customTextCell.text

        };
      }
    }
    
    if (rowData && rowData.rowType === 'Event') {
      const fieldName = change.columnId as keyof EventRow; 
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
          [fieldName]: customTextCell.text
        };
      }
    }

    if (rowData && rowData.rowType === 'Chart') {
      const chartRow =  rowData as ChartRow
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
        const startDate = new Date(customDateCell.text)
        const endDate = new Date(chartRow.plannedEndDate)
        updatedData[rowId] = {
          ...rowData,
          plannedStartDate: customDateCell.text,
          plannedDays: calculatePlannedDays(startDate, endDate, holidays, chartRow.isIncludeHolidays, regularHolidays)
        };
      } else if (fieldName === "plannedEndDate") {
        const customDateCell = newCell as CustomDateCell;
        const startDate = new Date(chartRow.plannedStartDate)
        const endDate = new Date(customDateCell.text)
        updatedData[rowId] = {
          ...rowData,
          plannedEndDate: customDateCell.text,
          plannedDays: calculatePlannedDays(startDate, endDate, holidays, chartRow.isIncludeHolidays, regularHolidays)
        };
      } else if (fieldName === "plannedDays") {
        const customTextCell = newCell as CustomTextCell;
        const plannedDays = Math.min(parseInt(customTextCell.text, 10), 9999);
        const startDate = new Date(chartRow.plannedStartDate)
        updatedData[rowId] = {
          ...rowData,
          plannedEndDate: toLocalISOString(addPlannedDays(startDate, plannedDays, holidays, chartRow.isIncludeHolidays, true, regularHolidays)),
          plannedDays: plannedDays
        };
      } else if (newCell.type === 'customText') {
        const customTextCell = newCell as CustomTextCell;
        updatedData[rowId] = {
          ...rowData,
          [fieldName]: customTextCell.text
        };
      } else if (fieldName === "isIncludeHolidays" && newCell.type === 'checkbox') {
        const checkboxCell = newCell as CheckboxCell;
        const startDate = new Date(chartRow.plannedStartDate)
        updatedData[rowId] = {
          ...rowData,
          isIncludeHolidays: checkboxCell.checked,
          plannedEndDate: toLocalISOString(addPlannedDays(startDate, chartRow.plannedDays, holidays, checkboxCell.checked, true, regularHolidays)),
        };
      }
    }    
  });

  dispatch(simpleSetData(updatedData));
};