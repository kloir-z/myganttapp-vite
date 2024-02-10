import React, { memo } from 'react';
import { SeparatorRow } from '../../types/DataTypes';
import { GanttRow } from '../../styles/GanttStyles';

interface SeparatorRowProps {
  entry: SeparatorRow;
  calendarWidth: number;
}

const SeparatorRowComponent: React.FC<SeparatorRowProps> = memo(({ entry, calendarWidth }) => {
  const topPosition = (entry.no - 1) * 21;

  return (
    <GanttRow style={{ position: 'absolute', top: `${topPosition}px`, height: '21px', width: `${calendarWidth}px`, backgroundColor: '#ddedff', borderBottom: 'solid 1px #e8e8e8' }} />
  );
});

export default SeparatorRowComponent;