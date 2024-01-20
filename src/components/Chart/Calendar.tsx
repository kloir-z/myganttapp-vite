// Calendar.tsx
import React, { memo } from 'react';
import { isHoliday } from './utils/CalendarUtil';
import { GanttRow, Cell } from '../../styles/GanttStyles';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';

interface CalendarProps {
  dateArray: Date[];
}

const Calendar: React.FC<CalendarProps> = memo(({ dateArray }) => {
  let previousMonth = dateArray[0].getMonth();
  const holidays = useSelector((state: RootState) => state.wbsData.present.holidays);
  const calendarWidth = dateArray.length * 21;
  const browserLocale = navigator.language.split('-')[0];
  let dateFormat: string;
  if (["ja", "zh", "ko", "hu"].includes(browserLocale)) {
    dateFormat = 'YYYY/MM';
  } else {
    dateFormat = 'MM/YYYY';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: `${calendarWidth}px` }}>
      <GanttRow style={{ borderBottom: 'none', background: 'none'}}>
        {dateArray.map((date, index) => {
          const month = date.getMonth();
          if (month !== previousMonth || index === 0) {
            previousMonth = month;
            const left = 21 * index;
            const displayDate = dateFormat === 'YYYY/MM' ? 
            `${date.getFullYear()}/${String(month + 1).padStart(2, '0')}` : 
            `${String(month + 1).padStart(2, '0')}/${date.getFullYear()}`;
            return (
              <Cell 
                key={index} 
                data-index={index}
                $isMonthStart={true}
                style={{
                  position: 'absolute',
                  left: `${left}px`
                }}
              >
                {displayDate}
              </Cell>
            );
          }
          return null;
        })}
      </GanttRow>
      <GanttRow style={{ borderBottom: 'none', background: 'none'}}>
        {dateArray.map((date, index) => {
          let type = 'weekday';
          if (date.getDay() === 6) type = 'saturday';
          if (date.getDay() === 0 || isHoliday(date, holidays)) type = 'sundayOrHoliday';
          const left = 21 * index;
          const isMonthStart = date.getDate() === 1;

          return (
            <Cell
              key={index}
              data-index={index}
              $type={type}
              $isMonthStart={isMonthStart}
              style={{
                position: 'absolute',
                left: `${left}px`,
                height: '21px',
                borderTop: '1px solid #00000016',
                borderBottom: '1px solid #00000016',
              }}
            >
              {date.getDate()}
            </Cell>
          );
        })}
      </GanttRow>
    </div>
  );
});

export default Calendar;