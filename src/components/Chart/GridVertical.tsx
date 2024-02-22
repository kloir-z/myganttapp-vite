// GridVertial.tsx
import React, { memo } from 'react';
import { isHoliday } from './utils/CalendarUtil';
import { GanttRow, CalendarCell } from '../../styles/GanttStyles';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';

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
        const dayOfWeek = date.getDay();
        const isMonthStart = date.getDate() === 1;
        const isFirstDate = index === 0;
        const borderLeft = cellWidth > 3 || dayOfWeek === 0 ? true : false;
        const setting = regularHolidaySetting.find(setting => setting.days.includes(dayOfWeek));
        const selectedSetting = setting || (isHoliday(date, holidays) ? regularHolidaySetting[1] : null);
        const chartBarColor = selectedSetting ? (cellWidth <= 11 ? selectedSetting.subColor : selectedSetting.color) : '';
        const left = cellWidth * index;

        return (
          <CalendarCell
            key={index}
            data-index={index}
            $isMonthStart={isMonthStart}
            $isFirstDate={isFirstDate}
            $chartBarColor={chartBarColor}
            $borderLeft={borderLeft}
            style={{
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