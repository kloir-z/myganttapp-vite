// GridVertial.tsx
import React, { memo } from 'react';
import { isHoliday } from './utils/CalendarUtil';
import { GanttRow, CalendarCell } from '../../styles/GanttStyles';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';

interface CalendarProps {
  dateArray: Date[];
  gridHeight: string;
}

const GridVertical: React.FC<CalendarProps> = memo(({ dateArray, gridHeight }) => {
  const holidays = useSelector((state: RootState) => state.wbsData.present.holidays);
  const regularHolidaySetting = useSelector((state: RootState) => state.wbsData.present.regularHolidaySetting);

  return (
    <GanttRow style={{ height: '0px', borderBottom: 'none' }}>
      {dateArray.map((date, index) => {
        let chartBarColor = '';
        const dayOfWeek = date.getDay();
        const isMonthStart = date.getDate() === 1;
        const isFirstDate = index === 0; 

        const setting = regularHolidaySetting.find(setting => setting.days.includes(dayOfWeek));
        if (setting) {
          chartBarColor = setting.color;
        } else if (isHoliday(date, holidays)) {
          chartBarColor = regularHolidaySetting[1].color;
        }
        const left = 21 * index;

        return (
          <CalendarCell
            key={index}
            data-index={index}
            $type='vertical'
            $isMonthStart={isMonthStart}
            $isFirstDate={isFirstDate}
            $chartBarColor={chartBarColor}
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