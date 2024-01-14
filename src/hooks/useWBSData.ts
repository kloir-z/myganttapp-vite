// hooks/useWBSData.ts
import { useState, useEffect } from 'react';
import { Column, Row, DefaultCellTypes, HeaderCell } from "@silevis/reactgrid";

export interface ExtendedColumn extends Column {
  visible: boolean;
}

export interface ColumnMap {
  no: 'No';
  textColumn1: 'C1';
  textColumn2: 'C2';
  textColumn3: 'C3';
  textColumn4: 'C4';
  color: 'Color';
  plannedStartDate: 'PlanS';
  plannedEndDate: 'PlanE';
  businessDays: 'D';
  actualStartDate: 'ActS';
  actualEndDate: 'ActE';
  displayName: 'DisplayName';
  dependency: 'Dep';
  dependentId: 'DepId';
  id: 'id'
}

export const columnMap: ColumnMap = {
  no: 'No',
  textColumn1: 'C1',
  textColumn2: 'C2',
  textColumn3: 'C3',
  textColumn4: 'C4',
  color: 'Color',
  plannedStartDate: 'PlanS',
  plannedEndDate: 'PlanE',
  businessDays: 'D',
  actualStartDate: 'ActS',
  actualEndDate: 'ActE',
  displayName: 'DisplayName',
  dependency: 'Dep',
  dependentId: 'DepId',
  id: 'id'
};

export const useWBSData = () => {
  const initialColumns: ExtendedColumn[] = [
    { columnId: "no", width: 30, resizable: false, visible: true },
    { columnId: "displayName", width: 100, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn1", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn2", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn3", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "textColumn4", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "color", width: 50, resizable: true, reorderable: true, visible: true },
    { columnId: "plannedStartDate", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "plannedEndDate", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "businessDays", width: 30, resizable: true, reorderable: true, visible: true },
    { columnId: "actualStartDate", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "actualEndDate", width: 40, resizable: true, reorderable: true, visible: true },
    { columnId: "dependency", width: 40, resizable: true, reorderable: true, visible: true },
  ];
  const [columns, setColumns] = useState<ExtendedColumn[]>(initialColumns);

  const getHeaderRow = (columns: ExtendedColumn[], columnMap: ColumnMap): Row<DefaultCellTypes> => {
    const cells = columns.filter(column => column.visible).map(column => {
      const headerText = columnMap[column.columnId as keyof ColumnMap];
      return { type: "header", text: headerText ?? "" } as HeaderCell;
    });
  
    return {
      rowId: "header",
      height: 21,
      cells: cells
    };
  };

  const [headerRow, setHeaderRow] = useState<Row<DefaultCellTypes>>(getHeaderRow(columns, columnMap));

  const visibleColumns = columns.filter(column => column.visible);

  useEffect(() => {
    setHeaderRow(getHeaderRow(columns, columnMap));
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