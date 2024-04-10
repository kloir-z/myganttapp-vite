import React, { memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../reduxStoreAndSlices/store';
import { setColumns, toggleColumnVisibility } from '../../../reduxStoreAndSlices/store';
import ColumnRow from './ColumnRow';
import SettingChildDiv from '../SettingChildDiv';
import { useTranslation } from 'react-i18next';

const ColumnSetting: React.FC = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const allColumns = useSelector((state: RootState) => state.wbsData.columns);
  const initialColumnOrder = [
    'displayName', 'color', 'plannedStartDate', 'plannedEndDate',
    'plannedDays', 'actualStartDate', 'actualEndDate', 'dependency',
    'textColumn1', 'textColumn2', 'textColumn3', 'textColumn4', 'isIncludeHolidays'
  ];
  const filteredColumns = initialColumnOrder
    .map(id => allColumns.find(col => col.columnId === id))
    .filter(col => col !== undefined && col.columnId !== 'no') as typeof allColumns;

  const updateColumnName = (columnId: string, newName: string) => {
    dispatch(setColumns(
      allColumns.map(column =>
        column.columnId === columnId ? { ...column, columnName: newName } : column
      )
    ));
  };

  return (
    <SettingChildDiv text={t('Column (Visiblity & Name)')}>
      {filteredColumns.map(column => (
        <ColumnRow
          key={column.columnId}
          column={column}
          updateColumnName={updateColumnName}
          toggleColumnVisibility={() => dispatch(toggleColumnVisibility(column.columnId))}
        />
      ))}
    </SettingChildDiv>
  );
});

export default ColumnSetting;