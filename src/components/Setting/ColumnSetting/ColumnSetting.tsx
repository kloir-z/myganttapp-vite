// ColumnSetting.tsx
import React, { Dispatch, SetStateAction } from "react";
import { ExtendedColumn } from "../../../hooks/useWBSData";
import ColumnRow from './ColumnRow';

type ColumnSettingProps = {
  columns: ExtendedColumn[];
  setColumns: Dispatch<SetStateAction<ExtendedColumn[]>>;
  toggleColumnVisibility: (columnId: string | number) => void;
};

const ColumnSetting: React.FC<ColumnSettingProps> = ({ columns, setColumns, toggleColumnVisibility }) => {
  const updateColumnName = (columnId: string, newName: string) => {
    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.columnId === columnId
          ? { ...column, columnName: newName }
          : column
      )
    );
  };

  return (
    <div style={{ marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
      {columns.map(column => (
        <ColumnRow
          key={column.columnId}
          column={column}
          updateColumnName={updateColumnName}
          toggleColumnVisibility={toggleColumnVisibility}
        />
      ))}
    </div>
  );
};

export default ColumnSetting;