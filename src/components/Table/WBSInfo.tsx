// WBSInfo.tsx
import React, { useCallback, Dispatch, SetStateAction } from 'react';
import { WBSData, ChartRow, SeparatorRow, EventRow  } from '../../types/DataTypes';
import { ReactGrid, Row, DefaultCellTypes, Id, MenuOption, SelectionMode } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import { handleCopySelectedRow, handlePasteRows, handleCutRows, handleAddChartRow, handleAddSeparatorRow, handleAddEventRow } from '../../utils/contextMenuHandlers';
import { createChartRow, createSeparatorRow, createEventRow } from '../../utils/wbsRowCreators';
import { handleGridChanges } from '../../utils/gridHandlers';
import { useColumnResizer } from '../../hooks/useColumnResizer';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, simpleSetData } from '../../reduxComponents/store';
import { CustomDateCell, CustomDateCellTemplate } from '../../utils/CustomDateCell';
import { CustomTextCell, CustomTextCellTemplate } from '../../utils/CustomTextCell';
import { assignIds, reorderArray } from '../../utils/wbsHelpers';
import { ExtendedColumn } from '../../hooks/useWBSData';

type WBSInfoProps = {
  headerRow: Row<DefaultCellTypes>;
  visibleColumns: ExtendedColumn[];
  columns: ExtendedColumn[];
  setColumns: Dispatch<SetStateAction<ExtendedColumn[]>>;
  toggleColumnVisibility: (columnId: string | number) => void;
};

const WBSInfo: React.FC<WBSInfoProps> = ({ headerRow, visibleColumns, columns, setColumns, toggleColumnVisibility }) => {
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.wbsData.present.data);
  const copiedRows = useSelector((state: RootState) => state.copiedRows.rows);
  const handleColumnResize = useColumnResizer(setColumns);
  const dataArray = Object.values(data);
  const customDateCellTemplate = new CustomDateCellTemplate();
  const customTextCellTemplate = new CustomTextCellTemplate();  

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

  const rows = getRows(dataArray);
  
  const simpleHandleContextMenu = useCallback((
    selectedRowIds: Id[],
    selectedColIds: Id[],
    selectionMode: SelectionMode,
    menuOptions: MenuOption[],
  ): MenuOption[] => {
    if (selectionMode === 'column') {
      menuOptions.push({
        id: "hideColumn",
        label: "Hide Column",
        handler: () => selectedColIds.forEach(colId => toggleColumnVisibility(colId))
      });
    }
    if (selectionMode === 'row') {
      menuOptions.length = 0;
      menuOptions.push(
        {
          id: "copyRow",
          label: "Copy Row",
          handler: () => handleCopySelectedRow(dispatch, selectedRowIds, dataArray)
        },
        {
          id: "cutRow",
          label: "Cut Row",
          handler: () => handleCutRows(dispatch, selectedRowIds, dataArray)
        },
        {
          id: "pasteRow",
          label: "Paste Row",
          handler: () => {
            if (selectedRowIds.length > 0) {
              handlePasteRows(dispatch, selectedRowIds[0], dataArray, copiedRows);
            }
          }
        },
        {
          id: "removeSelectedRow",
          label: "Remove Row",
          handler: () => handleCutRows(dispatch, selectedRowIds, dataArray)
        },
        {
          id: "addChartRow",
          label: "Add Chart Row",
          handler: () => handleAddChartRow(dispatch, selectedRowIds, dataArray)
        },
        {
          id: "addSeparatorRow",
          label: "Add Separator Row",
          handler: () => handleAddSeparatorRow(dispatch, selectedRowIds, dataArray)
        },
        {
          id: "addEventRow",
          label: "Add Event Row",
          handler: () => handleAddEventRow(dispatch, selectedRowIds, dataArray)
        },
      );
    }
    return menuOptions;
  }, [toggleColumnVisibility, dispatch, dataArray, copiedRows]);

  const handleRowsReorder = useCallback((targetRowId: Id, rowIds: Id[]) => {
    const targetIndex = dataArray.findIndex(data => data.id === targetRowId);
    const movingRowsIndexes = rowIds.map(id => dataArray.findIndex(data => data.id === id));
  
    const reorderedData = reorderArray(dataArray, movingRowsIndexes, targetIndex);
  
    dispatch(simpleSetData(assignIds(reorderedData)));
  }, [dataArray, dispatch]);

  const handleColumnsReorder = useCallback((targetColumnId: Id, columnIds: Id[]) => {
    const newColumnsOrder = [...columns];
    const targetIndex = newColumnsOrder.findIndex(column => column.columnId === targetColumnId);
  
    columnIds.forEach(columnId => {
      const index = newColumnsOrder.findIndex(column => column.columnId === columnId);
      if (index >= 0) {
        const [column] = newColumnsOrder.splice(index, 1);
        newColumnsOrder.splice(targetIndex, 0, column);
      }
    });
  
    setColumns(newColumnsOrder);
  }, [columns, setColumns]);

  const handleCanReorderRows = (targetRowId: Id): boolean => {
    return targetRowId !== 'header';
  }

  return (
    <ReactGrid
      rows={rows}
      columns={visibleColumns}
      onCellsChanged={(changes) => handleGridChanges(dispatch, data, changes)}
      onColumnResized={handleColumnResize}
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