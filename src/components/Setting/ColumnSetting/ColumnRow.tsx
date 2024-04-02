import React, { useState, useEffect, memo } from 'react';
import { ExtendedColumn } from '../../../reduxStoreAndSlices/store';

type ColumnRowProps = {
  column: ExtendedColumn;
  updateColumnName: (columnId: string, newName: string) => void;
  toggleColumnVisibility: (columnId: string) => void;
};

const ColumnRow: React.FC<ColumnRowProps> = memo(({ column, updateColumnName, toggleColumnVisibility }) => {
  const [localColumnName, setLocalColumnName] = useState(column.columnName ?? '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalColumnName(column.columnName ?? '');
    }
  }, [column.columnName, isFocused]);

  const handleBlur = () => {
    if (localColumnName !== column.columnName) {
      updateColumnName(column.columnId, localColumnName);
    }
    setIsFocused(false);
  };

  const handleFocus = () => setIsFocused(true);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
      <input
        type="checkbox"
        checked={column.visible}
        onChange={() => toggleColumnVisibility(column.columnId)}
      />
      <span onClick={() => toggleColumnVisibility(column.columnId)} style={{ width: '110px', marginRight: '10px', cursor: 'pointer' }}>
        {column.columnId.charAt(0).toUpperCase() + column.columnId.slice(1)}
      </span>
      <input
        type="text"
        value={localColumnName}
        onChange={(e) => setLocalColumnName(e.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        style={{ width: '100px', marginRight: '10px' }}
      />
    </div>
  );
});

export default ColumnRow;