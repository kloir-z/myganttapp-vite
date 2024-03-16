import React, { memo } from 'react';
import { SeparatorRow } from '../../types/DataTypes';
import { GanttRow } from '../../styles/GanttStyles';
import { RootState } from '../../reduxStoreAndSlices/store';
import { useSelector } from 'react-redux';

interface SeparatorRowProps {
  entry: SeparatorRow;
}

const SeparatorRowComponent: React.FC<SeparatorRowProps> = memo(({ entry }) => {
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const topPosition = (entry.no - 1) * 21;

  return (
    <GanttRow style={{ position: 'absolute', top: `${topPosition}px`, width: `${calendarWidth}px`, backgroundColor: '#ddedff', alignItems: 'center' }} >
      <span style={{ position: 'sticky', left: `0px`, color: '#000000ec', padding: '0px 6px', whiteSpace: 'nowrap' }}>{entry.displayName}</span>
    </GanttRow>
  );
});

export default SeparatorRowComponent;