import React, { memo, useEffect, useRef } from 'react';
import { RootState } from '../../reduxStoreAndSlices/store';
import { isHoliday } from '../../utils/CommonUtils';
import { GanttRow, CalendarCell } from '../../styles/GanttStyles';
import { useDispatch, useSelector } from 'react-redux';
import { setCellWidth } from "../../reduxStoreAndSlices/baseSettingsSlice";
import Tippy from '@tippyjs/react';
import { followCursor } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css'
import { cdate } from 'cdate';
import { useTranslation } from 'react-i18next';

interface CalendarProps {
  dateArray: ReturnType<typeof cdate>[];
}

const Calendar: React.FC<CalendarProps> = memo(({ dateArray }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  let previousMonth = dateArray[0].get("M") - 1;
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const holidays = useSelector((state: RootState) => state.wbsData.holidays);
  const holidayColor = useSelector((state: RootState) => state.wbsData.holidayColor);
  const regularDaysOffSetting = useSelector((state: RootState) => state.wbsData.regularDaysOffSetting);
  const dateFormat = useSelector((state: RootState) => state.wbsData.dateFormat);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const delta = event.deltaY < 0 ? 0.5 : -0.5;
      const newCellWidth = Math.min(Math.max(cellWidth + delta, 3), 21);
      dispatch(setCellWidth(newCellWidth));
      event.preventDefault();
    };

    const calendarElement = calendarRef.current;
    if (calendarElement) {
      calendarElement.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (calendarElement) {
        calendarElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [dispatch, cellWidth]);

  return (
    <Tippy
      content={
        <>
          {t('Current Column Width: ')}{`${cellWidth}px`}
          <br />
          {t('MouseWheel to change(3-21px)')}
        </>
      }
      plugins={[followCursor]}
      followCursor={'horizontal'}
      interactive={true}
      allowHTML={true}
      delay={[500, 0]}
      animation="fade"
      offset={[0, 20]}
      theme='light'
    >
      <div
        ref={calendarRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: `${calendarWidth + 2000}px`
        }}>
        <GanttRow style={{ borderBottom: 'none', background: 'none' }}>
          {dateArray.map((dateString, index) => {
            const date = dateString;
            const month = date.get('M') - 1;
            if (month !== previousMonth || index === 0) {
              previousMonth = month;
              const left = cellWidth * index;
              const isFirstDate = index === 0;
              const displayDate = (dateFormat === 'yyyy/MM/dd' || dateFormat === 'yyyy/M/d') ?
                `${date.format("YYYY")}/${date.format("M")}` :
                `${date.format("M")}/${date.format("YYYY")}`;
              return (
                <CalendarCell
                  key={index}
                  data-index={index}
                  $isMonthStart={true}
                  $isFirstDate={isFirstDate}
                  style={{
                    padding: '0px 5px',
                    left: `${left}px`,
                    height: '21px',
                  }}
                >
                  {displayDate}
                </CalendarCell>
              );
            }
            return null;
          })}
        </GanttRow>
        <GanttRow style={{ borderTop: '1px solid #00000016' }}>
          {dateArray.map((dateString, index) => {
            const date = dateString;
            const left = cellWidth * index;
            const dayOfWeek = date.get("day");
            const isMonthStart = date.get("date") === 1;
            const isFirstDate = index === 0;
            const borderLeft = cellWidth > 8 || dayOfWeek === 0 ? true : false;
            const setting = Object.values(regularDaysOffSetting).find(s => s.days.includes(dayOfWeek));
            const selectedSetting = setting || (isHoliday(date, holidays) ? holidayColor : null);
            const bgColor = selectedSetting ? (cellWidth <= 11 ? selectedSetting.subColor : selectedSetting.color) : 'transparent';
            const firstDayOfMonth = cdate(date.format("YYYY-MM") + "-01");
            const firstDayOfWeek = firstDayOfMonth.get("day");
            const lastDayOfMonth = firstDayOfMonth.add(1, "month").prev("day");
            const lastDayOfWeek = lastDayOfMonth.get("day");
            const skipFirstWeek = firstDayOfWeek >= 4 && firstDayOfWeek <= 6;
            const daysSinceFirstSunday = (date.get("date") - 1) + firstDayOfWeek;
            const weekNumber = Math.floor(daysSinceFirstSunday / 7) + (skipFirstWeek ? 0 : 1);
            const today = cdate();
            const isToday = date.format("YYYY/MM/DD") === today.format("YYYY/MM/DD");

            let displayText = `${date.get("date")}`;
            if (cellWidth <= 8) {
              if (lastDayOfWeek >= 0 && lastDayOfWeek <= 2 && date.get("date") > (lastDayOfMonth.get("date") - lastDayOfWeek - 1)) {
                displayText = '';
              } else if ((isMonthStart && !skipFirstWeek) || dayOfWeek === 0) {
                displayText = weekNumber > 0 ? `${weekNumber}` : '';
              } else {
                displayText = '';
              }
            }

            return (
              <>
                <CalendarCell
                  key={index}
                  data-index={index}
                  $isMonthStart={isMonthStart}
                  $isFirstDate={isFirstDate}
                  $bgColor={bgColor}
                  $borderLeft={borderLeft}
                  style={{
                    left: `${left}px`,
                    width: `${cellWidth + 0.1}px`,
                    height: '20px',
                    zIndex: displayText ? '1' : '-1',
                  }}
                >
                  <label
                    style={{
                      position: 'absolute',
                      zIndex: '1',
                      whiteSpace: 'nowrap',
                      letterSpacing: cellWidth <= 15 ? '-1px' : 'normal',
                      marginLeft: cellWidth <= 15 ? '-1px' : '0px',
                      transform: cellWidth > 8 && cellWidth <= 13 ? `scaleX(${0.6 + 0.06 * (cellWidth - 8)})` : 'none',
                    }}
                  >
                    {displayText}
                  </label>
                </CalendarCell>
                {isToday && (
                  <CalendarCell
                    key={`${index}-overlay`}
                    style={{
                      left: `${left}px`,
                      width: `${cellWidth + 0.1}px`,
                      height: '20px',
                      backgroundColor: 'rgba(255, 255, 0, 0.15)',
                      zIndex: '1',
                    }}
                  />
                )}
              </>
            );
          })}
        </GanttRow>
      </div>
    </Tippy >
  );
});

export default Calendar;