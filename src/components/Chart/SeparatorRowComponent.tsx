import React, { memo } from 'react';
import { SeparatorRow } from '../../types/DataTypes';
import { GanttRow } from '../../styles/GanttStyles';

interface SeparatorRowProps {
  entry: SeparatorRow;
  calendarWidth: number;
  separatorX: number;
  wbsWidth: number;
}

const SeparatorRowComponent: React.FC<SeparatorRowProps> = memo(({ entry, calendarWidth, separatorX }) => {
  const topPosition = (entry.no - 1) * 21;

  return (
    <GanttRow style={{ position: 'absolute', top: `${topPosition}px`, height: '21px', width: `${calendarWidth}px`, backgroundColor: '#ddedff', borderBottom: 'solid 1px #e8e8e8', alignItems: 'center', padding: '0px 6px' }} >
      <span style={{position: 'absolute', left: `${separatorX}px`, color: '#000000ca'}}>{entry.displayName}</span>
    </GanttRow>
  );
});

export default SeparatorRowComponent;