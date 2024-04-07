// WBSInfo.tsx
import React, { useCallback, useMemo, memo, useState, useRef } from 'react';
import { WBSData, isChartRow, isSeparatorRow, isEventRow } from '../../types/DataTypes';
import { ReactGrid, CellLocation, Row, DefaultCellTypes, Id, Highlight, HeaderCell } from "@silevis/reactgrid";
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

const WBSInfo: React.FC = memo(() => {
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.wbsData.data);
  const holidays = useSelector((state: RootState) => state.wbsData.holidays);
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
        height: 21,
        cells: cells
      };
    };
    return getHeaderRow(columns);
  }, [columns]);
  const visibleColumns = useMemo(() => columns.filter(column => column.visible), [columns]);
  const regularDaysOff = useSelector((state: RootState) => state.wbsData.regularDaysOff);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
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
          return createSeparatorRow(item, visibleColumns);
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

  const handleFocusLocationChanged = (location: CellLocation) => {
    if (location.columnId === "dependency") {
      const focusedRow = dataArray.find(row => row.id === location.rowId);
      if (focusedRow && isChartRow(focusedRow)) {
        const dependentRowId = focusedRow.dependentId;
        const dependentRow = dataArray.find(row => row.id === dependentRowId);
        if (dependentRow && isChartRow(dependentRow)) {
          const dependencyValue = focusedRow.dependency.split(',')[0].toLowerCase().trim();
          let columnIdToHighlight = "dependency";
          if (dependencyValue === "after") {
            columnIdToHighlight = "plannedEndDate";
          } else if (dependencyValue === "sameas") {
            columnIdToHighlight = "plannedStartDate";
          }
          const newHighlights = [
            { columnId: columnIdToHighlight, rowId: dependentRow.id, borderColor: "#ff00007f" }
          ];
          setHighlights(newHighlights);
        } else {
          setHighlights([]);
        }
      }
    } else {
      setHighlights([]);
    }
  };

  const menuOptions = useMemo(() => {
    const showColumnItems: MenuItemProps[] = [];
    let showColumnDisabled = true;

    columns.forEach(column => {
      if (!column.visible) {
        showColumnDisabled = false;
        const columnName = column.columnName ? column.columnName : column.columnId;
        showColumnItems.push({
          children: `Show ${columnName} Column`,
          onClick: () => dispatch(toggleColumnVisibility(column.columnId)),
        });
      }
    });
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
        children: "Copy Row",
        onClick: () => {
          const selectedRowIds = selectedRangesRef.current?.selectedRowIds || [];
          const copiedRows = selectedRowIds.reduce((acc, currId) => {
            const foundRow = dataArray.find(row => row.id === currId);
            if (foundRow) acc.push(foundRow);
            return acc;
          }, [] as WBSData[]);
          dispatch(setCopiedRows(copiedRows));
        },
      },
      {
        children: "Cut Row",
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
      },
      {
        children: "Insert Copied Row",
        onClick: () => {
          dispatch(insertCopiedRow({ insertAtId: selectedRangesRef.current?.selectedRowIds[0] || "", copiedRows }))
        },
        disabled: insertCopiedRowDisabled
      },
      {
        children: "Add Row",
        items: [
          {
            children: "Separator",
            onClick: () => {
              const insertAtId = selectedRangesRef.current?.selectedRowIds?.[0] || "";
              const numberOfRows = selectedRangesRef.current?.selectedRowIds.length || 1;
              dispatch(addRow({ rowType: "Separator", insertAtId, numberOfRows }));
            },
          },
          {
            children: "Chart",
            onClick: () => {
              const insertAtId = selectedRangesRef.current?.selectedRowIds?.[0] || "";
              const numberOfRows = selectedRangesRef.current?.selectedRowIds.length || 1;
              dispatch(addRow({ rowType: "Chart", insertAtId, numberOfRows }));
            },
            items: addChartRowItems
          },
          {
            children: "Event",
            onClick: () => {
              const insertAtId = selectedRangesRef.current?.selectedRowIds?.[0] || "";
              const numberOfRows = selectedRangesRef.current?.selectedRowIds.length || 1;
              dispatch(addRow({ rowType: "Event", insertAtId, numberOfRows }));
            },
            items: addEventRowItems
          }
        ]
      },
      {
        children: "Hide Column",
        onClick: () => {
          selectedRangesRef.current?.selectedColumnIds.forEach((colId) => dispatch(toggleColumnVisibility(colId.toString())))
          if (selectedRangesRef.current) {
            selectedRangesRef.current = {
              ...selectedRangesRef.current,
              selectedColumnIds: [],
            };
          }
        },
      },
      {
        children: "Show Column",
        items: showColumnItems,
        disabled: showColumnDisabled
      },
    ];
    return options;
  }, [dispatch, dataArray, copiedRows, columns]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectionChanged = useCallback((selectedRanges: any[]) => {
    const selectedRowIds: Set<string> = new Set();
    const selectedColumnIds: Set<string> = new Set();

    selectedRanges.forEach((range) => {
      for (let rowIdx = range.first.row.idx; rowIdx <= range.last.row.idx; rowIdx++) {
        const row = dataArray.find(row => row.no === rowIdx);
        if (row) {
          selectedRowIds.add(row.id);
        }
      }
      for (let colIdx = range.first.column.idx; colIdx <= range.last.column.idx; colIdx++) {
        const column = visibleColumns[colIdx];
        if (column) {
          selectedColumnIds.add(column.columnId);
        }
      }
    });

    selectedRangesRef.current = {
      selectedRowIds: Array.from(selectedRowIds),
      selectedColumnIds: Array.from(selectedColumnIds),
    };
  }, [dataArray, visibleColumns]);

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
        highlights={highlights}
        onFocusLocationChanged={handleFocusLocationChanged}
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