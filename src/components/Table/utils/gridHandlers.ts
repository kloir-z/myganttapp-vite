// gridHandlers.ts
import { CellChange, TextCell, NumberCell, CheckboxCell, EmailCell, DropdownCell, ChevronCell, HeaderCell, TimeCell, DateCell } from "@silevis/reactgrid";
import { WBSData, ChartRow, isChartRow, isEventRow, isSeparatorRow } from '../../../types/DataTypes';
import { Dispatch } from 'redux';
import { setEntireData, ExtendedColumn } from '../../../reduxStoreAndSlices/store';
import { CustomDateCell } from './CustomDateCell';
import { CustomTextCell } from "./CustomTextCell";
import { calculatePlannedDays, addPlannedDays } from "../../../utils/CommonUtils";
import { SeparatorCell } from "./SeparatorCell";

type AllCellTypes = TextCell | NumberCell | CheckboxCell | EmailCell | DropdownCell | ChevronCell | HeaderCell | TimeCell | DateCell | CustomDateCell | CustomTextCell | SeparatorCell;

export const handleGridChanges = (dispatch: Dispatch, data: { [id: string]: WBSData }, changes: CellChange<AllCellTypes>[], columns: ExtendedColumn[], holidays: string[], regularDaysOff: number[]) => {
  const updatedData = { ...data };
  const visibleColumns = columns.filter(column => column.visible);
  const secondVisibleColumnId = visibleColumns.length > 1 ? visibleColumns[1].columnId : null;

  changes.forEach((change) => {
    const rowId = change.rowId.toString();
    const rowData = updatedData[rowId];

    if (isSeparatorRow(rowData) && change.columnId === secondVisibleColumnId) {
      const newCell = change.newCell;

      if (newCell.type === 'separator') {
        const separatorCell = newCell as SeparatorCell;
        const updatedText = typeof separatorCell.text === 'string' ? separatorCell.text.trim() : separatorCell.text;
        updatedData[rowId] = {
          ...rowData,
          displayName: updatedText,
          isCollapsed: newCell.isCollapsed
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
        const updatedText = typeof customTextCell.text === 'string' ? customTextCell.text.trim() : customTextCell.text;
        updatedData[rowId] = {
          ...rowData,
          [fieldName]: updatedText
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
          plannedDays: calculatePlannedDays(startDate, endDate, holidays, chartRow.isIncludeHolidays, regularDaysOff)
        };
      } else if (fieldName === "plannedEndDate") {
        const customDateCell = newCell as CustomDateCell;
        const startDate = chartRow.plannedStartDate
        const endDate = customDateCell.text
        updatedData[rowId] = {
          ...rowData,
          plannedEndDate: customDateCell.text,
          plannedDays: calculatePlannedDays(startDate, endDate, holidays, chartRow.isIncludeHolidays, regularDaysOff)
        };
      } else if (fieldName === "plannedDays") {
        const customTextCell = newCell as CustomTextCell;
        const updatedText = typeof customTextCell.text === 'string' ? customTextCell.text.trim() : customTextCell.text;
        const plannedDays = Math.min(parseInt(updatedText, 10), 9999);
        const startDate = chartRow.plannedStartDate
        updatedData[rowId] = {
          ...rowData,
          plannedEndDate: addPlannedDays(startDate, plannedDays, holidays, chartRow.isIncludeHolidays, true, regularDaysOff),
          plannedDays: plannedDays
        };
      } else if (fieldName === "dependency") {
        const customTextCell = newCell as CustomTextCell;
        let updatedText = '';
        if (typeof customTextCell.text === 'string') {
          updatedText = customTextCell.text.trim();
        }
        if (updatedText && !updatedText.includes("^^user^^")) {
          updatedText += "^^user^^";
        }
        if (updatedText === '') {
          updatedData[rowId] = {
            ...rowData,
            [fieldName]: updatedText,
            dependentId: ''
          };
        } else {
          updatedData[rowId] = {
            ...rowData,
            [fieldName]: updatedText
          };
        }
      } else if (newCell.type === 'customText') {
        const customTextCell = newCell as CustomTextCell;
        const updatedText = typeof customTextCell.text === 'string' ? customTextCell.text.trim() : customTextCell.text;
        updatedData[rowId] = {
          ...rowData,
          [fieldName]: updatedText
        };
      } else if (fieldName === "isIncludeHolidays" && newCell.type === 'checkbox') {
        const checkboxCell = newCell as CheckboxCell;
        const startDate = chartRow.plannedStartDate
        updatedData[rowId] = {
          ...rowData,
          isIncludeHolidays: checkboxCell.checked,
          plannedEndDate: addPlannedDays(startDate, chartRow.plannedDays, holidays, checkboxCell.checked, true, regularDaysOff),
        };
      }
    }
  });

  dispatch(setEntireData(updatedData));
};