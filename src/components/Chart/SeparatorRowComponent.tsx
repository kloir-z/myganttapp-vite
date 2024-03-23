import React, { memo, useMemo } from 'react';
import { SeparatorRow } from '../../types/DataTypes';
import { GanttRow } from '../../styles/GanttStyles';
import { RootState } from '../../reduxStoreAndSlices/store';
import { useSelector } from 'react-redux';
import { cdate } from 'cdate';

interface SeparatorRowProps {
  entry: SeparatorRow;
  topPosition: number;
  dateArray: ReturnType<typeof cdate>[];
}

const SeparatorRowComponent: React.FC<SeparatorRowProps> = memo(({ entry, topPosition, dateArray }) => {
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);

  const { lineStart, lineWidth } = useMemo(() => {
    if (!entry.minStartDate || !entry.maxEndDate) {
      return { lineStart: 0, lineWidth: 0 };
    }
    const startDate = cdate(entry.minStartDate);
    const endDate = cdate(entry.maxEndDate);
    let startCDate = dateArray.findIndex(date => date >= startDate);
    let endCDate = dateArray.findIndex(date => date > endDate);
    if (startCDate === -1) {
      startCDate = dateArray.length - 1;
    } else if (startCDate < 0) {
      startCDate = 0;
    }
    if (endCDate === -1) {
      endCDate = dateArray.length;
    } else if (endCDate < 0) {
      endCDate = 0;
    }
    const lineStart = startCDate * cellWidth;
    const lineWidth = (endCDate - startCDate) * cellWidth;
    return { lineStart, lineWidth };
  }, [entry.minStartDate, entry.maxEndDate, dateArray, cellWidth]);

  return (
    <GanttRow style={{ position: 'absolute', top: `${topPosition}px`, width: `${calendarWidth}px`, backgroundColor: '#ddedff', alignItems: 'center' }} >
      {entry.isCollapsed &&
        <div style={{ position: 'absolute', top: '0px', left: `${lineStart}px`, width: `${lineWidth}px`, height: '21px', backgroundColor: '#bfbfbf5d' }}></div>
      }
      <span style={{ position: 'sticky', left: `0px`, color: '#000000ec', padding: '0px 6px', whiteSpace: 'nowrap' }}>{entry.displayName}</span>
    </GanttRow>
  );
});

export default SeparatorRowComponent;
