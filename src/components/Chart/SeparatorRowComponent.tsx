import React, { memo } from 'react';
import { SeparatorRow } from '../../types/DataTypes';
import { GanttRow } from '../../styles/GanttStyles';

interface SeparatorRowProps {
  entry: SeparatorRow;
  separatorX: number;
  wbsWidth: number;
}

const SeparatorRowComponent: React.FC<SeparatorRowProps> = memo(({ entry, separatorX, wbsWidth }) => {
  const topPosition = (entry.no - 1) * 21;

  return (
    <GanttRow style={{ position: 'absolute', top: `${topPosition}px`, left: `${separatorX}px`, height: '21px', width: `calc(100vw - ${wbsWidth}px)`, backgroundColor: '#ddedff', borderBottom: 'solid 1px #e8e8e8', color: '#000000ca', alignItems: 'center', padding: '0px 6px' }} >
      <span>{entry.displayName}</span>
    </GanttRow>
  );
});

export default SeparatorRowComponent;