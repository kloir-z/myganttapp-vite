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
  const filteredColumns = allColumns.filter(column => column.columnId !== 'no');

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