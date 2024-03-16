import React, { memo } from 'react';
import { SeparatorRow } from '../../types/DataTypes';

interface SeparatorRowLabelProps {
  entry: SeparatorRow;
}

const SeparatorRowLabelComponent: React.FC<SeparatorRowLabelProps> = memo(({ entry }) => {
  const topPosition = ((entry.no - 1) * 21) + 23;

  return (
    <span style={{ position: 'absolute', top: `${topPosition}px`, left: '35px', padding: '0px 6px', zIndex: '1', pointerEvents: 'none', fontSize: '0.8rem' }}>{entry.displayName}</span>
  );
});

export default SeparatorRowLabelComponent;