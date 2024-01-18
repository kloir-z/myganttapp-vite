// GridVertial.tsx
import React, { memo } from 'react';
import { isHoliday } from '../utils/CalendarUtil';
import { GanttRow, Cell } from '../styles/GanttStyles';
import { useSelector } from 'react-redux';
import { RootState } from '../reduxComponents/store';

interface CalendarProps {
  dateArray: Date[];
  gridHeight: string;
}

const GridVertical: React.FC<CalendarProps> = memo(({ dateArray, gridHeight }) => {
  const holidays = useSelector((state: RootState) => state.wbsData.present.holidays);
  return (
    <GanttRow style={{height: '0px', borderBottom: 'none'}}>
      {dateArray.map((date, index) => {
        let type = 'weekday';
        const isMonthStart = date.getDate() === 1;

        if (date.getDay() === 6) type = 'saturday';
        if (date.getDay() === 0 || isHoliday(date, holidays)) type = 'sundayOrHoliday';
        const left = 21 * index;

        return (
          <Cell
            key={index}
            data-index={index}
            $type={type}
            $isMonthStart={isMonthStart}
            style={{
              position: 'absolute',
              top: '0px',
              left: `${left}px`,
              height: gridHeight,
            }}
          />
        );
      })}
    </GanttRow>
  );
});

export default GridVertical;