// GridVertial.tsx
import React, { memo } from 'react';
import { isHoliday } from './utils/CalendarUtil';
import { GanttRow, CalendarCell } from '../../styles/GanttStyles';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { adjustColorOpacity } from './utils/CalendarUtil';

interface CalendarProps {
  dateArray: Date[];
  gridHeight: number;
}

const GridVertical: React.FC<CalendarProps> = memo(({ dateArray, gridHeight }) => {
  const holidays = useSelector((state: RootState) => state.wbsData.present.holidays);
  const regularHolidaySetting = useSelector((state: RootState) => state.wbsData.present.regularHolidaySetting);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);

  return (
    <GanttRow style={{ height: '0px', borderBottom: 'none' }}>
      {dateArray.map((date, index) => {
        let chartBarColor = '';
        const dayOfWeek = date.getDay();
        const isMonthStart = date.getDate() === 1;
        const isFirstDate = index === 0;
        const setting = regularHolidaySetting.find(setting => setting.days.includes(dayOfWeek));
        if (setting) {
          chartBarColor = adjustColorOpacity(setting.color, cellWidth);
        } else if (isHoliday(date, holidays)) {
          chartBarColor = adjustColorOpacity(regularHolidaySetting[1].color, cellWidth);
        }

        const left = cellWidth * index;
        const borderLeft = cellWidth > 15 || dayOfWeek === 0 ? true : false;

        return (
          <CalendarCell
            key={index}
            data-index={index}
            $type='vertical'
            $isMonthStart={isMonthStart}
            $isFirstDate={isFirstDate}
            $chartBarColor={chartBarColor}
            $borderLeft={borderLeft}
            style={{
              position: 'absolute',
              top: '0px',
              left: `${left}px`,
              height: `${gridHeight}px`,
              width: `${cellWidth + 0.1}px`,
            }}
          />
        );
      })}
    </GanttRow>
  );
});

export default GridVertical;