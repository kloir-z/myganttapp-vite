// utils/contextMenuHandlers.ts
import { WBSData, ChartRow, SeparatorRow, EventRow } from '../../../types/DataTypes';
import { assignIds } from './wbsHelpers';
import { simpleSetData } from '../../../reduxStoreAndSlices/store';
import { Id } from "@silevis/reactgrid";
import { Dispatch } from 'redux';
import { setCopiedRows } from '../../../reduxStoreAndSlices/copiedRowsSlice';

export const handleCopySelectedRow = (dispatch: Dispatch, selectedRowIds: Id[], dataArray: WBSData[]) => {
  const copiedRows = dataArray.filter(item => selectedRowIds.includes(item.id)).map(item => {
    const copy = { ...item };
    copy.id = '';
    return copy;
  });
  dispatch(setCopiedRows(copiedRows));
};

export const handleInsertCopiedRows = (dispatch: Dispatch, targetRowId: Id, dataArray: WBSData[], copiedRows: WBSData[]) => {
  if (copiedRows.length === 0) {
    return;
  }

  const targetIndex = dataArray.findIndex(row => row.id === targetRowId);
  if (targetIndex === -1) {
    return;
  }

  const newDataArray = dataArray.slice();
  newDataArray.splice(targetIndex, 0, ...copiedRows);
  dispatch(simpleSetData(assignIds(newDataArray)));
};

export const handleCutRows = (dispatch: Dispatch, selectedRowIds: Id[], dataArray: WBSData[]) => {
  const copiedRows = dataArray.filter(item => selectedRowIds.includes(item.id)).map(item => {
    const copy = { ...item };
    copy.id = '';
    return copy;
  });
  dispatch(setCopiedRows(copiedRows));
  const newDataArray = dataArray.filter(item => 
    !selectedRowIds.includes(item.id));
  dispatch(simpleSetData(assignIds(newDataArray)));
};

export const handleAddChartRow = (dispatch: Dispatch, selectedRowIds: Id[], dataArray: WBSData[]) => {
  const newDataArray = dataArray.slice();
  const minIndex = Math.min(...selectedRowIds.map(id => 
    newDataArray.findIndex(item => item.id === id)));

  for (let i = 0; i < selectedRowIds.length; i++) {
    const newDataRow: ChartRow = {
      rowType: "Chart",
      no: 0,
      id: "",
      textColumn1: "",
      textColumn2: "",
      textColumn3: "",
      textColumn4: "",
      color: "",
      plannedStartDate: "",
      plannedEndDate: "",
      plannedDays: null,
      actualStartDate: "",
      actualEndDate: "",
      displayName: "",
      dependentId: "",
      dependency: "",
      isIncludeHolidays: false,
    };
    newDataArray.splice(minIndex + i, 0, newDataRow);
  }

  dispatch(simpleSetData(assignIds(newDataArray)));
};

export const handleAddSeparatorRow = (dispatch: Dispatch, selectedRowIds: Id[], dataArray: WBSData[]) => {
  const newDataArray = dataArray.slice();
  const minIndex = Math.min(...selectedRowIds.map(id => 
    newDataArray.findIndex(item => item.id === id)));

  for (let i = 0; i < selectedRowIds.length; i++) {
    const newDataRow: SeparatorRow = {
      rowType: "Separator",
      no: 0,
      id: "",
      displayName: ""
    };
    newDataArray.splice(minIndex + i, 0, newDataRow);
  }

  dispatch(simpleSetData(assignIds(newDataArray)));
};

export const handleAddEventRow = (dispatch: Dispatch, selectedRowIds: Id[], dataArray: WBSData[]) => {
  const newDataArray = dataArray.slice();
  const minIndex = Math.min(...selectedRowIds.map(id => 
    newDataArray.findIndex(item => item.id === id)));

  for (let i = 0; i < selectedRowIds.length; i++) {
    const newDataRow: EventRow = {
      rowType: "Event",
      no: 0,
      id: "",
      textColumn1: "",
      textColumn2: "",
      textColumn3: "",
      textColumn4: "",
      plannedStartDate: "",
      plannedEndDate: "",
      plannedDays: null,
      actualStartDate: "",
      actualEndDate: "",
      color: "",
      displayName: "",
      eventData: []
    };
    newDataArray.splice(minIndex + i, 0, newDataRow);
  }

  dispatch(simpleSetData(assignIds(newDataArray)));
};
