import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../reduxStoreAndSlices/store';
import { setColumns, toggleColumnVisibility } from '../../../reduxStoreAndSlices/baseSettingsSlice';
import ColumnRow from './ColumnRow';

const ColumnSetting: React.FC = () => {
  const dispatch = useDispatch();
  const allColumns = useSelector((state: RootState) => state.baseSettings.columns);
  const filteredColumns = allColumns.filter(column => column.columnId !== 'no');

  const updateColumnName = (columnId: string, newName: string) => {
    dispatch(setColumns(
      allColumns.map(column =>
        column.columnId === columnId ? { ...column, columnName: newName } : column
      )
    ));
  };

  return (
    <div style={{ marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
      {filteredColumns.map(column => (
        <ColumnRow
          key={column.columnId}
          column={column}
          updateColumnName={updateColumnName}
          toggleColumnVisibility={() => dispatch(toggleColumnVisibility(column.columnId))}
        />
      ))}
    </div>
  );
};

export default ColumnSetting;