import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../reduxStoreAndSlices/store';
import { ExtendedColumn } from '../../../reduxStoreAndSlices/baseSettingsSlice';
import { Row, DefaultCellTypes, HeaderCell } from "@silevis/reactgrid";

export const useWBSData = () => {
  const columns = useSelector((state: RootState) => state.baseSettings.columns);

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

  useEffect(() => {
    setHeaderRow(getHeaderRow(columns));
  }, [columns]);

  const visibleColumns = columns.filter(column => column.visible);

  return { visibleColumns, headerRow };
};
