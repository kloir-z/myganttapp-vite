// gridHandlers.ts
import { CellChange, TextCell, NumberCell, CheckboxCell, EmailCell, DropdownCell, ChevronCell, HeaderCell, TimeCell, DateCell } from "@silevis/reactgrid";
import { WBSData, ChartRow, EventRow } from '../../../types/DataTypes';
import { Dispatch } from 'redux';
import { simpleSetData } from '../../../reduxStoreAndSlices/store';
import { CustomDateCell } from './CustomDateCell';
import { CustomTextCell } from "./CustomTextCell";
import { ExtendedColumn } from "../hooks/useWBSData";

type AllCellTypes  = TextCell | NumberCell | CheckboxCell | EmailCell | DropdownCell | ChevronCell | HeaderCell | TimeCell | DateCell | CustomDateCell | CustomTextCell;  

export const handleGridChanges = (dispatch: Dispatch, data: { [id: string]: WBSData }, changes: CellChange<AllCellTypes>[],columns: ExtendedColumn[]) => {
  const updatedData = { ...data };
  const visibleColumns = columns.filter(column => column.visible);
  const secondVisibleColumnId = visibleColumns.length > 1 ? visibleColumns[1].columnId : null;


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
      const fieldName = change.columnId as keyof ChartRow; 
      const newCell = change.newCell;
    
      if (newCell.type === 'customDate') {
        const customDateCell = newCell as CustomDateCell;
        updatedData[rowId] = {
          ...rowData,
          [fieldName]: customDateCell.text
        };
      } else if (fieldName === 'dependency' && newCell.type === 'customText') {
        const customText = (newCell as CustomTextCell).text;
    
        if (customText) {
          const parts = customText.split(',');
          if (parts.length >= 2) {
            const refRowNo = parts[1].trim();
      
            let refRowId: string | undefined;
            if (refRowNo.startsWith('+') || refRowNo.startsWith('-')) {
              const offset = parseInt(refRowNo, 10);
              let currentIndex = Object.keys(data).indexOf(rowId);
              let steps = Math.abs(offset);
      
              while (steps > 0 && currentIndex >= 0 && currentIndex < Object.keys(data).length) {
                currentIndex += (offset / Math.abs(offset));
                if (currentIndex < 0 || currentIndex >= Object.keys(data).length) {
                  break;
                }
                if (data[Object.keys(data)[currentIndex]].rowType === 'Chart') {
                  steps--;
                }
              }
      
              if (currentIndex >= 0 && currentIndex < Object.keys(data).length) {
                refRowId = Object.keys(data)[currentIndex];
              }
            } else {
              const targetNo = parseInt(refRowNo, 10);
              refRowId = Object.keys(data).find(key => {
                const keyRowData = data[key];
                return keyRowData.rowType === 'Chart' && (keyRowData as ChartRow).no === targetNo;
              });
            }
      
            if (refRowId) {
              updatedData[rowId] = {
                ...rowData,
                dependentId: refRowId,
                dependency: customText
              };
            }
          }
        } else {
          updatedData[rowId] = {
            ...rowData,
            dependentId: '',
            dependency: ''
          };
        }
      } else if (newCell.type === 'customText') {
        const customTextCell = newCell as CustomTextCell;
        updatedData[rowId] = {
          ...rowData,
          [fieldName]: customTextCell.text
        };
      } else if (newCell.type === 'checkbox') {
        const customTextCell = newCell as CheckboxCell;
        updatedData[rowId] = {
          ...rowData,
          [fieldName]: customTextCell.checked
        };
      }
    }    
  });

  dispatch(simpleSetData(updatedData));
};