// WBSInfo.tsx
import React, { useCallback, useMemo, memo, useRef } from 'react';
import { WBSData, isChartRow, isSeparatorRow, isEventRow } from '../../types/DataTypes';
import { ReactGrid, CellLocation, Row, DefaultCellTypes, Id, MenuOption, SelectionMode } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import "/src/components/Table/css/ReactGrid.css";
import { handleCopySelectedRow, handleInsertCopiedRows, handleCutRows, handleAddChartRow, handleAddSeparatorRow, handleAddEventRow } from './utils/contextMenuHandlers';
import { createChartRow, createSeparatorRow, createEventRow } from './utils/wbsRowCreators';
import { handleGridChanges } from './utils/gridHandlers';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setEntireData, handleColumnResize, toggleColumnVisibility, setColumns, pushPastState, toggleSeparatorRowExpanded } from '../../reduxStoreAndSlices/store';
import { CustomDateCell, CustomDateCellTemplate } from './utils/CustomDateCell';
import { CustomTextCell, CustomTextCellTemplate } from './utils/CustomTextCell';
import { assignIds, reorderArray } from './utils/wbsHelpers';
import { useWBSData } from './hooks/useWBSData';

const WBSInfo: React.FC = memo(() => {
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.wbsData.data);
  const holidays = useSelector((state: RootState) => state.wbsData.holidays);
  const copiedRows = useSelector((state: RootState) => state.copiedRows.rows);
  const showYear = useSelector((state: RootState) => state.wbsData.showYear);
  const columns = useSelector((state: RootState) => state.wbsData.columns);
  const regularDaysOff = useSelector((state: RootState) => state.wbsData.regularDaysOff);
  const isSeparatorRowFocusedRef = useRef<{ row: string, column: string }>();
  const { headerRow, visibleColumns } = useWBSData();
  const dataArray = useMemo(() => {
    return Object.values(data);
  }, [data]);

  const customDateCellTemplate = useMemo(() => new CustomDateCellTemplate(showYear), [showYear]);
  const customTextCellTemplate = useMemo(() => new CustomTextCellTemplate(), []);
  const getRows = useCallback((data: WBSData[]): Row<DefaultCellTypes | CustomDateCell | CustomTextCell>[] => {
    let collapseSection = false;
    return [
      headerRow,
      ...data.flatMap((item) => {
        if (isSeparatorRow(item)) {
          collapseSection = item.isCollapsed;
          return createSeparatorRow(item, visibleColumns.length);
        } else if (!collapseSection && isChartRow(item)) {
          return createChartRow(item, visibleColumns);
        } else if (!collapseSection && isEventRow(item)) {
          return createEventRow(item, visibleColumns);
        } else {
          return [];
        }
      })
    ];
  }, [visibleColumns, headerRow]);
  const rows = useMemo(() => getRows(dataArray), [dataArray, getRows]);

  const getSelectedIdsFromRanges = useCallback((selectedRanges: CellLocation[][]) => {
    const selectedRowIdsFromRanges = new Set<Id>();
    const selectedColIdsFromRanges = new Set<Id>();

    selectedRanges.flat().forEach(({ rowId, columnId }) => {
      selectedRowIdsFromRanges.add(rowId);
      selectedColIdsFromRanges.add(columnId);
    });

    return {
      selectedRowIdsFromRanges: Array.from(selectedRowIdsFromRanges),
      selectedColIdsFromRanges: Array.from(selectedColIdsFromRanges)
    };
  }, []);

  const simpleHandleContextMenu = useCallback((
    _selectedRowIds: Id[],
    _selectedColIds: Id[],
    _selectionMode: SelectionMode,
    menuOptions: MenuOption[],
    selectedRanges: CellLocation[][]
  ): MenuOption[] => {
    const { selectedRowIdsFromRanges, selectedColIdsFromRanges } = getSelectedIdsFromRanges(selectedRanges);

    menuOptions.push(
      {
        id: "copyRow",
        label: "Copy Row",
        handler: () => handleCopySelectedRow(dispatch, selectedRowIdsFromRanges, dataArray)
      },
      {
        id: "cutRow",
        label: "Cut Row (Copy & Delete)",
        handler: () => handleCutRows(dispatch, selectedRowIdsFromRanges, dataArray)
      },
      {
        id: "insertCopiedRow",
        label: "Insert Copied Row",
        handler: () => {
          if (selectedRowIdsFromRanges.length > 0) {
            handleInsertCopiedRows(dispatch, selectedRowIdsFromRanges[0], dataArray, copiedRows);
          }
        }
      },
      {
        id: "addChartRow",
        label: "Add Chart Row",
        handler: () => handleAddChartRow(dispatch, selectedRowIdsFromRanges, dataArray)
      },
      {
        id: "addSeparatorRow",
        label: "Add Separator Row",
        handler: () => handleAddSeparatorRow(dispatch, selectedRowIdsFromRanges, dataArray)
      },
      {
        id: "addEventRow",
        label: "Add Event Row",
        handler: () => handleAddEventRow(dispatch, selectedRowIdsFromRanges, dataArray)
      },
      {
        id: "hideColumn",
        label: "Hide Column",
        handler: () => selectedColIdsFromRanges.forEach((colId: Id) => dispatch(toggleColumnVisibility(colId.toString())))
      },
    );
    columns.forEach(column => {
      if (!column.visible) {
        const columnName = column.columnName ? column.columnName : column.columnId;
        menuOptions.push({
          id: `showColumn-${column.columnId}`,
          label: `Show ${columnName} Column`,
          handler: () => dispatch(toggleColumnVisibility(column.columnId))
        });
      }
    });
    return menuOptions;
  }, [getSelectedIdsFromRanges, columns, dispatch, dataArray, copiedRows]);

  const handleRowsReorder = useCallback((targetRowId: Id, rowIds: Id[]) => {
    const targetIndex = dataArray.findIndex(data => data.id === targetRowId);
    let movingRowsIndexes = rowIds.map(id => dataArray.findIndex(data => data.id === id));
    const extendedIndexes: number[] = [];
    for (const index of movingRowsIndexes) {
      if (isSeparatorRow(dataArray[index])) {
        let nextSeparatorIndex = dataArray.slice(index + 1).findIndex(data => isSeparatorRow(data));
        if (nextSeparatorIndex !== -1) {
          nextSeparatorIndex += index + 1;
        } else {
          nextSeparatorIndex = dataArray.length;
        }
        for (let i = index; i < nextSeparatorIndex; i++) {
          if (!extendedIndexes.includes(i)) {
            extendedIndexes.push(i);
          }
        }
      }
    }
    movingRowsIndexes = [...new Set([...movingRowsIndexes, ...extendedIndexes])];
    const sortedMovingRowsIndexes = [...movingRowsIndexes].sort((a, b) => a - b);
    const reorderedData = reorderArray(dataArray, sortedMovingRowsIndexes, targetIndex);
    dispatch(setEntireData(assignIds(reorderedData)));
  }, [dataArray, dispatch]);

  const handleColumnsReorder = useCallback((targetColumnId: Id, columnIds: Id[]) => {
    if (columnIds.includes("no")) {
      return;
    }

    const targetIndex = columns.findIndex(data => data.columnId === targetColumnId);
    const noColumnIndex = columns.findIndex(data => data.columnId === "no");

    const adjustedTargetIndex = targetIndex <= noColumnIndex ? noColumnIndex + 1 : targetIndex;

    const movingColumnsIndexes = columnIds.map(id => columns.findIndex(data => data.columnId === id));
    const sortedMovingColumnsIndexes = [...movingColumnsIndexes].sort((a, b) => a - b);

    const tempColumns = columns.map(column => ({ ...column, id: column.columnId }));
    const reorderedTempColumns = reorderArray(tempColumns, sortedMovingColumnsIndexes, adjustedTargetIndex);
    const reorderedColumns = reorderedTempColumns.map(column => ({ ...column, columnId: column.id, id: undefined }));

    dispatch(pushPastState());
    dispatch(setColumns(reorderedColumns));
  }, [columns, dispatch]);

  const onColumnResize = useCallback((columnId: Id, width: number) => {
    const columnIdAsString = columnId.toString();
    dispatch(pushPastState());
    dispatch(handleColumnResize({ columnId: columnIdAsString, width }));
  }, [dispatch]);

  const handleCanReorderRows = useCallback((targetRowId: Id): boolean => {
    return targetRowId !== 'header';
  }, []);

  const handleFocusLocationChanged = useCallback((location: CellLocation) => {
    if (isSeparatorRow(data[location.rowId.toString()])) {
      isSeparatorRowFocusedRef.current = { row: location.rowId.toString(), column: location.columnId.toString() }
    } else {
      isSeparatorRowFocusedRef.current = undefined;
    }
  }, [data]);

  const handleFocusLocationChanging = useCallback((location: CellLocation) => {
    const currentColumnIndex = columns.findIndex(column => column.columnId === isSeparatorRowFocusedRef.current?.column);
    const newColumnIndex = columns.findIndex(column => column.columnId === location.columnId);
    const rowData = data[location.rowId.toString()];
    if (rowData && isSeparatorRowFocusedRef.current && isSeparatorRow(rowData)) {
      if (newColumnIndex === 0 && currentColumnIndex === 1 && !rowData.isCollapsed) {
        dispatch(toggleSeparatorRowExpanded({ id: location.rowId.toString(), isCollapsed: true }));
        return false;
      } else if (newColumnIndex === 2 && currentColumnIndex === 1 && rowData.isCollapsed) {
        dispatch(toggleSeparatorRowExpanded({ id: location.rowId.toString(), isCollapsed: false }));
        return false;
      }
    }
    return true;
  }, [columns, data, dispatch]);

  return (
    <ReactGrid
      rows={rows}
      columns={visibleColumns}
      onCellsChanged={(changes) => handleGridChanges(dispatch, data, changes, columns, holidays, regularDaysOff)}
      onColumnResized={onColumnResize}
      onContextMenu={simpleHandleContextMenu}
      stickyTopRows={1}
      stickyLeftColumns={1}
      enableRangeSelection
      enableColumnSelection
      enableRowSelection
      onRowsReordered={handleRowsReorder}
      onColumnsReordered={handleColumnsReorder}
      canReorderRows={handleCanReorderRows}
      onFocusLocationChanged={handleFocusLocationChanged}
      onFocusLocationChanging={handleFocusLocationChanging}
      customCellTemplates={{ customDate: customDateCellTemplate, customText: customTextCellTemplate }}
      minColumnWidth={10}
    />
  );
});

export default WBSInfo;