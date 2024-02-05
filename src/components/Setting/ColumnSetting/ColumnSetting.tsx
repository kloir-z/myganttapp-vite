import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../reduxStoreAndSlices/store'; // `RootState` はストアの状態の型です
import { setColumns, toggleColumnVisibility } from '../../../reduxStoreAndSlices/baseSettingsSlice';
import ColumnRow from './ColumnRow';

const ColumnSetting: React.FC = () => {
  const dispatch = useDispatch();
  const columns = useSelector((state: RootState) => state.baseSettings.columns);

  const updateColumnName = (columnId: string, newName: string) => {
    dispatch(setColumns(
      columns.map(column =>
        column.columnId === columnId ? { ...column, columnName: newName } : column
      )
    ));
  };

  return (
    <div style={{ marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
      {columns.map(column => (
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
