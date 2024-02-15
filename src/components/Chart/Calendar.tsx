
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: `${calendarWidth}px`
    }}>
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
      <GanttRow style={{
        background: 'none',
        borderTop: '1px solid #00000016',
        borderBottom: '1px solid #00000016',
      }}>
        {dateArray.map((date, index) => {
          const left = cellWidth * index;
          let chartBarColor = '';
          const dayOfWeek = date.getDay();
          const isMonthStart = date.getDate() === 1;
          const isFirstDate = index === 0;
          const borderLeft = cellWidth > 15 || dayOfWeek === 0 ? true : false;
          const setting = regularHolidaySetting.find(setting => setting.days.includes(dayOfWeek));
          const adjustColorOpacity = (color: string, cellWidth: number): string => {
            if (cellWidth <= 15) {
              if (/^#/.test(color)) {
                if (color.length === 9) {
                  return color.substring(0, 7) + '40';
                } else if (color.length === 7) {
                  return color + '40';
                }
              }
              else if (/^rgba/.test(color)) {
                return color.replace(/[\d.]+\)$/g, '0.3)');
              }
            }
            return color;
          };
          if (setting) {
            chartBarColor = adjustColorOpacity(setting.color, cellWidth);
          } else if (isHoliday(date, holidays)) {
            chartBarColor = adjustColorOpacity(regularHolidaySetting[1].color, cellWidth);
          }

          const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const firstDayOfWeek = firstDayOfMonth.getDay();
          const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          const lastDayOfWeek = lastDayOfMonth.getDay();
          const skipFirstWeek = firstDayOfWeek >= 4 && firstDayOfWeek <= 6;
          const daysSinceFirstSunday = (date.getDate() - 1) + firstDayOfWeek;
          const weekNumber = Math.floor(daysSinceFirstSunday / 7) + (skipFirstWeek ? 0 : 1);

          let displayText = `${date.getDate()}`;
          if (cellWidth <= 7) {
            displayText = '';
          } else if (cellWidth <= 15) {
            if (lastDayOfWeek >= 0 && lastDayOfWeek <= 2 && date.getDate() > (lastDayOfMonth.getDate() - lastDayOfWeek - 1)) {
              displayText = '';
            } else if ((isMonthStart && !skipFirstWeek) || dayOfWeek === 0) {
              displayText = weekNumber > 0 ? `${weekNumber}` : '';
            } else {
              displayText = '';
            }
          }

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
                left: `${left}px`,
                height: '20px',
                width: `${cellWidth}px`,
                borderTop: 'none',
                borderBottom: 'none',
                zIndex: '-1'
              }}
            >
              {displayText}
            </CalendarCell>
          );
        })}
      </GanttRow>
    </div>
  );
});

export default Calendar;