import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState, ExtendedColumn } from '../../../reduxStoreAndSlices/store';
import { Row, DefaultCellTypes, HeaderCell } from "@silevis/reactgrid";

export const useWBSData = () => {
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

  return { visibleColumns, headerRow };
};