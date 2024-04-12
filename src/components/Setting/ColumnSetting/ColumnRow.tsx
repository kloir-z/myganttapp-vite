import React, { useState, useEffect, memo, useRef, useCallback } from 'react';
import { ExtendedColumn } from '../../../reduxStoreAndSlices/store';
import { useTranslation } from 'react-i18next';

type ColumnRowProps = {
  column: ExtendedColumn;
  updateColumnName: (columnId: string, newName: string) => void;
  toggleColumnVisibility: (columnId: string) => void;
};

const ColumnRow: React.FC<ColumnRowProps> = memo(({ column, updateColumnName, toggleColumnVisibility }) => {
  const { t } = useTranslation();
  const [localColumnName, setLocalColumnName] = useState(column.columnName);
  const aliasTimeoutRef = useRef<number | null>(null);

  const resetAliasTimeout = useCallback(() => {
    if (aliasTimeoutRef.current) {
      clearTimeout(aliasTimeoutRef.current);
    }
    aliasTimeoutRef.current = window.setTimeout(() => {
      updateColumnName(column.columnId, localColumnName);
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column.columnId, localColumnName]);

  useEffect(() => {
    resetAliasTimeout();
  }, [localColumnName, resetAliasTimeout]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
      <input
        type="checkbox"
        checked={column.visible}
        onChange={() => toggleColumnVisibility(column.columnId)}
      />
      <span onClick={() => toggleColumnVisibility(column.columnId)} style={{ width: '110px', marginRight: '10px', cursor: 'pointer' }}>
        {t(column.columnId)}
      </span>
      <input
        type="text"
        value={localColumnName}
        onChange={(e) => setLocalColumnName(e.target.value)}
        style={{ width: '100px', marginRight: '10px' }}
      />
    </div>
  );
});

export default ColumnRow;