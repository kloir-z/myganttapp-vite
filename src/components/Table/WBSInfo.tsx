// WBSInfo.tsx
import React, { useCallback, useMemo } from 'react';
import { WBSData, ChartRow, SeparatorRow, EventRow } from '../../types/DataTypes';
import { ReactGrid, CellLocation, Row, DefaultCellTypes, Id, MenuOption, SelectionMode } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import { handleCopySelectedRow, handleInsertCopiedRows, handleCutRows, handleAddChartRow, handleAddSeparatorRow, handleAddEventRow } from './utils/contextMenuHandlers';
import { createChartRow, createSeparatorRow, createEventRow } from './utils/wbsRowCreators';
import { handleGridChanges } from './utils/gridHandlers';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, simpleSetData, ExtendedColumn, handleColumnResize, toggleColumnVisibility, setColumns, pushPastState } from '../../reduxStoreAndSlices/store';
import { CustomDateCell, CustomDateCellTemplate } from './utils/CustomDateCell';
import { CustomTextCell, CustomTextCellTemplate } from './utils/CustomTextCell';
import { assignIds, reorderArray } from './utils/wbsHelpers';
import { isEqual } from 'lodash';

type WBSInfoProps = {
  headerRow: Row<DefaultCellTypes>;
  visibleColumns: ExtendedColumn[];
};

const WBSInfo: React.FC<WBSInfoProps> = ({ headerRow, visibleColumns }) => {
  const dispatch = useDispatch();
  const data = useSelector(
    (state: RootState) => state.wbsData.data,
    (prevData, nextData) => isEqual(prevData, nextData)
  );
  const holidays = useSelector((state: RootState) => state.wbsData.holidays);
  const regularHolidaySetting = useSelector((state: RootState) => state.wbsData.regularHolidaySetting);
  const copiedRows = useSelector((state: RootState) => state.copiedRows.rows);
  const showYear = useSelector((state: RootState) => state.wbsData.showYear);
  const columns = useSelector((state: RootState) => state.wbsData.columns);

  const regularHolidays = useMemo(() => {
    return Array.from(new Set(regularHolidaySetting.flatMap(setting => setting.days)));
  }, [regularHolidaySetting]);

  const dataArray = useMemo(() => {
    return Object.values(data);
  }, [data]);

  const customDateCellTemplate = useMemo(() => new CustomDateCellTemplate(showYear), [showYear]);
  const customTextCellTemplate = useMemo(() => new CustomTextCellTemplate(), []);
  const getRows = useCallback((data: WBSData[]): Row<DefaultCellTypes | CustomDateCell | CustomTextCell>[] => {
    return [
      headerRow,
      ...data.map((item) => {
        switch (item.rowType) {
          case 'Chart':
            return createChartRow(item as ChartRow, visibleColumns);
          case 'Separator':
            return createSeparatorRow(item as SeparatorRow, visibleColumns.length);
          case 'Event':
            return createEventRow(item as EventRow, visibleColumns);
          default:
            return { rowId: 'empty', height: 21, cells: [{ type: "customText", text: '' } as CustomTextCell], reorderable: true };
        }
      })
    ];
  }, [visibleColumns, headerRow]);

  const rows = useMemo(() => getRows(dataArray), [dataArray, getRows]);

  const getSelectedIdsFromRanges = useCallback((selectedRanges: Array<Array<CellLocation>>) => {
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
    selectedRanges: Array<CellLocation[]>
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
    const movingRowsIndexes = rowIds.map(id => dataArray.findIndex(data => data.id === id));
    const sortedMovingRowsIndexes = [...movingRowsIndexes].sort((a, b) => a - b);

    const reorderedData = reorderArray(dataArray, sortedMovingRowsIndexes, targetIndex);

    dispatch(simpleSetData(assignIds(reorderedData)));
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

  return (
    <ReactGrid
      rows={rows}
      columns={visibleColumns}
      onCellsChanged={(changes) => handleGridChanges(dispatch, data, changes, columns, holidays, regularHolidays)}
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
      customCellTemplates={{ customDate: customDateCellTemplate, customText: customTextCellTemplate }}
      minColumnWidth={10}
    />
  );
};

export default WBSInfo;