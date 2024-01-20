// hooks/useWBSData.ts
import { useState, useEffect } from 'react';
import { Column, Row, DefaultCellTypes, HeaderCell } from "@silevis/reactgrid";

export interface ExtendedColumn extends Column {
  columnId: string;
  columnName?: string;
  visible: boolean;
}

export const useWBSData = () => {
  const initialColumns: ExtendedColumn[] = [
    { columnId: "no", columnName: "No", width: 30, resizable: false, visible: true },
    { columnId: "displayName", columnName: "DisplayName", width: 100, resizable: true, reorderable: true, visible: true },
    { columnId: "color", columnName: "Color", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "plannedStartDate", columnName: "PlanS", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "plannedEndDate", columnName: "PlanE", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "businessDays", columnName: "D", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "actualStartDate", columnName: "ActS", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "actualEndDate", columnName: "ActE", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "dependency", columnName: "Dep", width: 60, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn1", columnName: "C1", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn2", columnName: "C2", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn3", columnName: "C3", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn4", columnName: "C4", width: 50, resizable: true, reorderable: true, visible: true },
  ];
  const [columns, setColumns] = useState<ExtendedColumn[]>(initialColumns);

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

  const [headerRow, setHeaderRow] = useState<Row<DefaultCellTypes>>(getHeaderRow(columns));

  const visibleColumns = columns.filter(column => column.visible);

  useEffect(() => {
    setHeaderRow(getHeaderRow(columns));
  }, [columns]);

  const toggleColumnVisibility = (columnId: string | number) => {
    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.columnId === columnId
          ? { ...column, visible: !column.visible }
          : column
      )
    );
  };

  return { initialColumns, visibleColumns, columns, setColumns, headerRow, toggleColumnVisibility };
}