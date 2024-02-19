// GridVertial.tsx
import React, { useState, useEffect, memo } from 'react';
import { isHoliday } from './utils/CalendarUtil';
import { GanttRow, CalendarCell } from '../../styles/GanttStyles';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { isEqual } from 'lodash';

interface CalendarProps {
  dateArray: Date[];
  gridHeight: number;
}

const GridVertical: React.FC<CalendarProps> = memo(({ dateArray }) => {
  const holidays = useSelector((state: RootState) => state.wbsData.present.holidays);
  const regularHolidaySetting = useSelector((state: RootState) => state.wbsData.present.regularHolidaySetting);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const [gridHeight, setGridHeight] = useState<number>(0);
  const data = useSelector(
    (state: RootState) => state.wbsData.present.data,
    (prevData, nextData) => isEqual(prevData, nextData)
  );

  useEffect(() => {
    const calculateGridHeight = () => {
      const rowCount = Object.keys(data).length;
      const maxGridHeight = window.innerHeight - 41;
      const dynamicGridHeight = rowCount * 21;
      return rowCount * 21 < window.innerHeight - 41 ? dynamicGridHeight : maxGridHeight;
    };
    const updateGridHeight = () => {
      setGridHeight(calculateGridHeight());
    };
    window.addEventListener('resize', updateGridHeight);
    updateGridHeight();
    return () => window.removeEventListener('resize', updateGridHeight);
  }, [data]);

  return (
    <GanttRow style={{ height: '0px', borderBottom: 'none' }}>
      {dateArray.map((date, index) => {
        let chartBarColor = '';
        const dayOfWeek = date.getDay();
        const isMonthStart = date.getDate() === 1;
        const isFirstDate = index === 0;
        const borderLeft = cellWidth > 3 || dayOfWeek === 0 ? true : false;
        const setting = regularHolidaySetting.find(setting => setting.days.includes(dayOfWeek));
        const selectedSetting = setting || (isHoliday(date, holidays) ? regularHolidaySetting[1] : null);
        chartBarColor = selectedSetting ? (cellWidth <= 12 ? selectedSetting.subColor : selectedSetting.color) : '';
        const left = cellWidth * index;

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