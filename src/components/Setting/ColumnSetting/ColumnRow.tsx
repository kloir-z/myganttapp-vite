// ColumnRow.tsx
import React, { useState, useEffect } from 'react';
import { ExtendedColumn } from "../../Table/hooks/useWBSData";

type ColumnRowProps = {
  column: ExtendedColumn;
  updateColumnName: (columnId: string, newName: string) => void;
  toggleColumnVisibility: (columnId: string | number) => void;
};

const ColumnRow: React.FC<ColumnRowProps> = ({ column, updateColumnName, toggleColumnVisibility }) => {
  const [localColumnName, setLocalColumnName] = useState(column.columnName);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalColumnName(column.columnName);
    }
  }, [column.columnName, column.columnId, isFocused]);


  const handleBlur = () => {
    updateColumnName(column.columnId, localColumnName ?? '');
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      updateColumnName(column.columnId, localColumnName ?? '');
    }
  };

  const handleSpanClick = () => {
    toggleColumnVisibility(column.columnId);
  };

  if (column.columnId === 'no') {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }} key={column.columnId}>
      <input
        type="checkbox"
        checked={column.visible}
        onChange={() => toggleColumnVisibility(column.columnId)}
      />
      <span onClick={handleSpanClick} style={{ width: '100px', marginRight: '10px', cursor: 'pointer' }}>
        {column.columnId.charAt(0).toUpperCase() + column.columnId.slice(1)}:
      </span>
      <input
        type="text"
        value={localColumnName}
        onChange={(e) => setLocalColumnName(e.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        style={{ marginRight: '10px' }}
      />
    </div>
  );
};

export default ColumnRow;