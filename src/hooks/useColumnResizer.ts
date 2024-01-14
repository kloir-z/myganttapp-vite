import { Dispatch, SetStateAction } from 'react';
import { Id } from "@silevis/reactgrid";
import { ExtendedColumn } from '../hooks/useWBSData';

export const useColumnResizer = (setColumns: Dispatch<SetStateAction<ExtendedColumn[]>>) => {
  const handleColumnResize = (columnId: Id, width: number) => {
    setColumns((prevColumns) => {
      const columnIndex = prevColumns.findIndex(col => col.columnId === columnId);
      const updatedColumns = [...prevColumns];
      updatedColumns[columnIndex] = { ...updatedColumns[columnIndex], width };
      return updatedColumns;
    });
  };

  return handleColumnResize;
};