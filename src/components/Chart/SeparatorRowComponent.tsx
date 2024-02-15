import React, { memo } from 'react';
import { SeparatorRow } from '../../types/DataTypes';
import { GanttRow } from '../../styles/GanttStyles';
import { RootState } from '../../reduxStoreAndSlices/store';
import { useSelector } from 'react-redux';

interface SeparatorRowProps {
  entry: SeparatorRow;
  separatorX: number;
  wbsWidth: number;
}

const SeparatorRowComponent: React.FC<SeparatorRowProps> = memo(({ entry, separatorX }) => {
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const topPosition = (entry.no - 1) * 21;

  return (
    <GanttRow style={{ position: 'absolute', top: `${topPosition}px`, height: '21px', width: `${calendarWidth}px`, backgroundColor: '#ddedff', borderBottom: 'solid 1px #e8e8e8', alignItems: 'center' }} >
      <span style={{ position: 'absolute', left: `${separatorX}px`, color: '#000000ca', padding: '0px 6px' }}>{entry.displayName}</span>
    </GanttRow>
  );
});

export default SeparatorRowComponent;