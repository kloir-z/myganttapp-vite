// WBSInfo.tsx
import React, { useCallback, useMemo, memo, useRef } from 'react';
import { WBSData, isChartRow, isSeparatorRow, isEventRow, MyRange } from '../../types/DataTypes';
import { ReactGrid, Row, DefaultCellTypes, Id, HeaderCell, MenuOption, SelectionMode } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import "/src/components/Table/css/ReactGrid.css";
import { createChartRow, createSeparatorRow, createEventRow } from './utils/wbsRowCreators';
import { handleGridChanges } from './utils/gridHandlers';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setEntireData, handleColumnResize, toggleColumnVisibility, setColumns, pushPastState, addRow, ExtendedColumn, deleteRows, insertCopiedRow } from '../../reduxStoreAndSlices/store';
import { CustomDateCell, CustomDateCellTemplate } from './utils/CustomDateCell';
import { CustomTextCell, CustomTextCellTemplate } from './utils/CustomTextCell';
import { SeparatorCell, SeparatorCellTemplate } from './utils/SeparatorCell';
import { assignIds, reorderArray } from './utils/wbsHelpers';
import ContextMenu from '../ContextMenu/ContextMenu';
import { MenuItemProps } from '../ContextMenu/ContextMenuItem';
import { setCopiedRows } from '../../reduxStoreAndSlices/copiedRowsSlice';
import { setIsSettingsModalOpen } from '../../reduxStoreAndSlices/uiFlagSlice';
import { useTranslation } from 'react-i18next';

const WBSInfo: React.FC = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.wbsData.data);
  const holidays = useSelector((state: RootState) => state.wbsData.holidays);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const rowHeight = useSelector((state: RootState) => state.baseSettings.rowHeight);
  const copiedRows = useSelector((state: RootState) => state.copiedRows.rows);
  const showYear = useSelector((state: RootState) => state.wbsData.showYear);
  const dateFormat = useSelector((state: RootState) => state.wbsData.dateFormat);
  const columns = useSelector((state: RootState) => state.wbsData.columns);
  const headerRow = useMemo(() => {
    const getHeaderRow = (columns: ExtendedColumn[]): Row<DefaultCellTypes> => {
      const cells = columns.filter(column => column.visible).map(column => {
        return { type: "header", text: column.columnName ?? "" } as HeaderCell;
      });
      return {
        rowId: "header",
        height: rowHeight,
        cells: cells
      };
    };
    return getHeaderRow(columns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, wbsWidth]);
  const visibleColumns = useMemo(() => columns.filter(column => column.visible), [columns]);
  const regularDaysOff = useSelector((state: RootState) => state.wbsData.regularDaysOff);
  const selectedRangesRef = useRef<{ selectedRowIds: string[], selectedColumnIds: string[] }>();
  const wbsRef = useRef<HTMLDivElement>(null);
  const dataArray = useMemo(() => {
    return Object.values(data);
  }, [data]);

  const customDateCellTemplate = useMemo(() => new CustomDateCellTemplate(showYear, dateFormat), [showYear, dateFormat]);
  const customTextCellTemplate = useMemo(() => new CustomTextCellTemplate(), []);
  const separatorCellTemplate = useMemo(() => new SeparatorCellTemplate(), [])
  const getRows = useCallback((data: WBSData[]): Row<DefaultCellTypes | CustomDateCell | CustomTextCell | SeparatorCell>[] => {
    let collapseSection = false;
    return [
      headerRow,
      ...data.flatMap((item) => {
        if (isSeparatorRow(item)) {
          collapseSection = item.isCollapsed;
          return createSeparatorRow(item, visibleColumns, rowHeight);
        } else if (!collapseSection && isChartRow(item)) {
          return createChartRow(item, visibleColumns, rowHeight);
        } else if (!collapseSection && isEventRow(item)) {
          return createEventRow(item, visibleColumns, rowHeight);
        } else {
          return [];
        }
      })
    ];
  }, [headerRow, visibleColumns, rowHeight]);
  const rows = useMemo(() => getRows(dataArray), [dataArray, getRows]);

  const handleRowsReorder = useCallback((targetRowId: Id, rowIds: Id[]) => {
    const targetIndex = dataArray.findIndex(data => data.id === targetRowId);
    const movingRowsIndexes = rowIds.map(id => dataArray.findIndex(data => data.id === id));
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

  const handleContextMenu = useCallback((
    _selectedRowIds: Id[],
    _selectedColIds: Id[],
    _selectionMode: SelectionMode,
    menuOptions: MenuOption[]
  ): MenuOption[] => {
    const newMenuOptions = menuOptions.filter(option =>
      option.id !== "copy" && option.id !== "cut" && option.id !== "paste"
    );
    return newMenuOptions;
  }, []);

  const menuOptions = useMemo(() => {
    const initialColumnOrder = [
      'displayName', 'color', 'plannedStartDate', 'plannedEndDate',
      'plannedDays', 'actualStartDate', 'actualEndDate', 'dependency',
      'textColumn1', 'textColumn2', 'textColumn3', 'textColumn4', 'isIncludeHolidays'
    ];
    const columnSettingsItems: MenuItemProps[] = initialColumnOrder.reduce((acc: MenuItemProps[], columnId) => {
      const column = columns.find(col => col.columnId === columnId);
      if (column) {
        acc.push({
          children: `${column.columnName}`,
          onClick: () => dispatch(toggleColumnVisibility(column.columnId)),
          checked: column.visible,
        });
      }
      return acc;
    }, []);
    const addChartRowItems = [];
    for (let i = 1; i <= 10; i++) {
      addChartRowItems.push({
        children: `${i}`,
        onClick: () => {
          const insertAtId = selectedRangesRef.current?.selectedRowIds?.[0] || "";
          dispatch(addRow({ rowType: "Chart", insertAtId, numberOfRows: i }));
        },
      });
    }
    const addEventRowItems = [];
    for (let i = 1; i <= 10; i++) {
      addEventRowItems.push({
        children: `${i}`,
        onClick: () => {
          const insertAtId = selectedRangesRef.current?.selectedRowIds?.[0] || "";
          dispatch(addRow({ rowType: "Event", insertAtId, numberOfRows: i }));
        },
      });
    }
    const insertCopiedRowDisabled = copiedRows.length === 0 || (selectedRangesRef.current?.selectedRowIds?.length || 0) === 0;
    const options = [
      {
        children: t("Copy Row"),
        onClick: () => {
          const selectedRowIds = selectedRangesRef.current?.selectedRowIds || [];
          const copiedRows = selectedRowIds.reduce((acc, currId) => {
            const foundRow = dataArray.find(row => row.id === currId);
            if (foundRow) acc.push(foundRow);
            return acc;
          }, [] as WBSData[]);
          dispatch(setCopiedRows(copiedRows));
        },
        path: '0'
      },
      {
        children: t("Cut Row"),
        onClick: () => {
          const selectedRowIds = selectedRangesRef.current?.selectedRowIds || [];
          const copiedRows = selectedRowIds.reduce((acc, currId) => {
            const foundRow = dataArray.find(row => row.id === currId);
            if (foundRow) acc.push(foundRow);
            return acc;
          }, [] as WBSData[]);
          dispatch(setCopiedRows(copiedRows));
          dispatch(deleteRows(selectedRowIds))
        },
        path: '1'
      },
      {
        children: t("Insert Copied Row"),
        onClick: () => {
          dispatch(insertCopiedRow({ insertAtId: selectedRangesRef.current?.selectedRowIds[0] || "", copiedRows }))
        },
        path: '2',
        disabled: insertCopiedRowDisabled
      },
      {
        children: t("Add Row"),
        items: [
          {
            children: t("Separator"),
            onClick: () => {
              const insertAtId = selectedRangesRef.current?.selectedRowIds?.[0] || "";
              const numberOfRows = selectedRangesRef.current?.selectedRowIds.length || 1;
              dispatch(addRow({ rowType: "Separator", insertAtId, numberOfRows }));
            },
            path: '3.0'
          },
          {
            children: t("Chart"),
            onClick: () => {
              const insertAtId = selectedRangesRef.current?.selectedRowIds?.[0] || "";
              const numberOfRows = selectedRangesRef.current?.selectedRowIds.length || 1;
              dispatch(addRow({ rowType: "Chart", insertAtId, numberOfRows }));
            },
            items: addChartRowItems,
            path: '3.1'
          },
          {
            children: t("Event"),
            onClick: () => {
              const insertAtId = selectedRangesRef.current?.selectedRowIds?.[0] || "";
              const numberOfRows = selectedRangesRef.current?.selectedRowIds.length || 1;
              dispatch(addRow({ rowType: "Event", insertAtId, numberOfRows }));
            },
            items: addEventRowItems,
            path: '3.2'
          }
        ],
        path: '3'
      },
      {
        children: t("Show/Hide Column"),
        items: columnSettingsItems,
        path: '4'
      },
      {
        children: t("Setting"),
        onClick: () => {
          dispatch(setIsSettingsModalOpen(true))
        },
        path: '5'
      }
    ];
    return options;
  }, [copiedRows, t, columns, dispatch, dataArray]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectionChanged = useCallback((selectedRanges: MyRange[]) => {
    const selectedRowIds: Set<string> = new Set();
    const selectedColumnIds: Set<string> = new Set();
    selectedRanges.forEach((range) => {
      range.rows.forEach(row => {
        selectedRowIds.add(row.rowId.toString());
      });
      range.columns.forEach(column => {
        selectedColumnIds.add(column.columnId.toString());
      });
    });
    selectedRangesRef.current = {
      selectedRowIds: Array.from(selectedRowIds),
      selectedColumnIds: Array.from(selectedColumnIds),
    };
  }, []);

  return (
    <div ref={wbsRef}>
      <ReactGrid
        rows={rows}
        columns={visibleColumns}
        onCellsChanged={(changes) => handleGridChanges(dispatch, data, changes, columns, holidays, regularDaysOff)}
        onColumnResized={onColumnResize}
        stickyTopRows={1}
        stickyLeftColumns={1}
        enableRangeSelection
        enableColumnSelection
        enableRowSelection
        onRowsReordered={handleRowsReorder}
        onColumnsReordered={handleColumnsReorder}
        onContextMenu={handleContextMenu}
        onSelectionChanged={handleSelectionChanged}
        canReorderRows={handleCanReorderRows}
        customCellTemplates={{ customDate: customDateCellTemplate, customText: customTextCellTemplate, separator: separatorCellTemplate }}
        minColumnWidth={10}
      />
      <ContextMenu
        targetRef={wbsRef}
        items={menuOptions}
      />
    </div>
  );
});

export default WBSInfo;