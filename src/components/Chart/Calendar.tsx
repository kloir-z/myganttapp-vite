// Calendar.tsx
import React, { memo } from 'react';
import { isHoliday } from './utils/CalendarUtil';
import { GanttRow, CalendarCell } from '../../styles/GanttStyles';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';

interface CalendarProps {
  dateArray: Date[];
}

const Calendar: React.FC<CalendarProps> = memo(({ dateArray }) => {
  let previousMonth = dateArray[0].getMonth();
  const holidays = useSelector((state: RootState) => state.wbsData.present.holidays);
  const regularHolidaySetting = useSelector((state: RootState) => state.wbsData.present.regularHolidaySetting);
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const browserLocale = navigator.language.split('-')[0];
  let dateFormat: string;
  if (["ja", "zh", "ko", "hu"].includes(browserLocale)) {
    dateFormat = 'YYYY/MM';
  } else {
    dateFormat = 'MM/YYYY';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: `${calendarWidth}px` }}>
      <GanttRow style={{ borderBottom: 'none', background: 'none' }}>
        {dateArray.map((date, index) => {
          const month = date.getMonth();
          if (month !== previousMonth || index === 0) {
            previousMonth = month;
            const left = cellWidth * index;
            const isFirstDate = index === 0;
            const displayDate = dateFormat === 'YYYY/MM' ?
              `${date.getFullYear()}/${String(month + 1).padStart(2, '0')}` :
              `${String(month + 1).padStart(2, '0')}/${date.getFullYear()}`;
            return (
              <CalendarCell
                key={index}
                data-index={index}
                $isMonthStart={true}
                $isFirstDate={isFirstDate}
                style={{
                  position: 'absolute',
                  padding: '0px 5px',
                  left: `${left}px`
                }}
              >
                {displayDate}
              </CalendarCell>
            );
          }
          return null;
        })}
      </GanttRow>
      <GanttRow style={{ borderBottom: 'none', background: 'none' }}>
        {dateArray.map((date, index) => {
          const left = cellWidth * index;
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
                left: `${left}px`,
                height: '21px',
                width: `${cellWidth}px`,
                borderTop: '1px solid #00000016',
                borderBottom: '1px solid #00000016',
              }}
            >
              {date.getDate()}
            </CalendarCell>
          );
        })}
      </GanttRow>
    </div>
  );
});

export default Calendar;