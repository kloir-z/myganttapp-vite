import { memo } from 'react';
import ChartRowComponent from './ChartRowComponent';
import { ChartRow, SeparatorRow, EventRow } from '../../types/DataTypes';
import EventRowComponent from './EventRowComponent';
import SeparatorRowComponent from './SeparatorRowComponent';
import { WBSData } from '../../types/DataTypes';

interface GanttRowProps {
  data: WBSData[];
  dateArray: Date[];
  gridRef: React.RefObject<HTMLDivElement>;
  setCanDrag: (canDrag: boolean) => void;
  index: number;
  calendarWidth: number;
}
const GanttRow: React.FC<GanttRowProps> = memo(({ data, dateArray, gridRef, setCanDrag, index, calendarWidth }) => {
  const entry = data[index];

  if (entry.rowType === 'Chart') {
    return (
      <ChartRowComponent
        entry={entry as ChartRow}
        dateArray={dateArray}
        gridRef={gridRef}
        setCanDrag={setCanDrag}
      />
    );
  } else if (entry.rowType === 'Separator') {
    return (
      <SeparatorRowComponent
        entry={entry as SeparatorRow}
        calendarWidth={calendarWidth}
      />
    );
  } else if (entry.rowType === 'Event') {
    return (
      <EventRowComponent
        entry={entry as EventRow}
        dateArray={dateArray}
        gridRef={gridRef}
        setCanDrag={setCanDrag}
      />
    );
  }
  return null;
});

export default GanttRow;