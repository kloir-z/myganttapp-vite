import React, { memo, useEffect, useRef } from 'react';
import { RootState } from '../../reduxStoreAndSlices/store';
import { isHoliday } from '../../utils/CommonUtils';
import { GanttRow, CalendarCell } from '../../styles/GanttStyles';
import { useDispatch, useSelector } from 'react-redux';
import { setCellWidth } from "../../reduxStoreAndSlices/baseSettingsSlice";
import Tippy from '@tippyjs/react';
import { followCursor } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { cdate } from 'cdate';

interface CalendarProps {
  dateArray: ReturnType<typeof cdate>[];
}

const Calendar: React.FC<CalendarProps> = memo(({ dateArray }) => {
  const dispatch = useDispatch();
  let previousMonth = dateArray[0].get("M") - 1;
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const holidays = useSelector((state: RootState) => state.wbsData.holidays);
  const regularDaysOffSetting = useSelector((state: RootState) => state.wbsData.regularDaysOffSetting);
  const calendarRef = useRef<HTMLDivElement>(null);
  const browserLocale = navigator.language.split('-')[0];
  let dateFormat: string;
  if (["ja", "zh", "ko", "hu"].includes(browserLocale)) {
    dateFormat = 'YYYY/MM';
  } else {
    dateFormat = 'MM/YYYY';
  }

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.shiftKey) {
        const delta = event.deltaY < 0 ? 0.5 : -0.5;
        const newCellWidth = Math.min(Math.max(cellWidth + delta, 3), 21);
        dispatch(setCellWidth(newCellWidth));
        event.preventDefault();
      }
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
          {`Current Cell Width: ${cellWidth}px`}
          <br />
          {'Shift + MouseWheel to change size(3-21px).'}
        </>
      }
      plugins={[followCursor]}
      followCursor={true}
      interactive={true}
      allowHTML={true}
      delay={[1000, 0]}
      animation="fade"
      offset={[0, 20]}
    >
      <div
        ref={calendarRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: `${calendarWidth}px`
        }}>
        <GanttRow style={{ borderBottom: 'none', background: 'none' }}>
          {dateArray.map((dateString, index) => {
            const date = dateString;
            const month = date.get('M') - 1;
            if (month !== previousMonth || index === 0) {
              previousMonth = month;
              const left = cellWidth * index;
              const isFirstDate = index === 0;
              const displayDate = dateFormat === 'YYYY/MM' ?
                `${date.format("YYYY")}/${date.format("MM")}` :
                `${date.format("MM")}/${date.format("YYYY")}`;
              return (
                <CalendarCell
                  key={index}
                  data-index={index}
                  $isMonthStart={true}
                  $isFirstDate={isFirstDate}
                  style={{
                    padding: '0px 5px',
                    left: `${left}px`,
                    height: '22px',
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
            let bgColor = '';
            const dayOfWeek = date.get("day");
            const isMonthStart = date.get("date") === 1;
            const isFirstDate = index === 0;
            const borderLeft = cellWidth > 11 || dayOfWeek === 0 ? true : false;
            const setting = regularDaysOffSetting.find(setting => setting.days.includes(dayOfWeek));
            const selectedSetting = setting || (isHoliday(date, holidays) ? regularDaysOffSetting[1] : null);
            bgColor = selectedSetting ? (cellWidth <= 11 ? selectedSetting.subColor : selectedSetting.color) : '';
            const firstDayOfMonth = cdate(date.format("YYYY-MM") + "-01");
            const firstDayOfWeek = firstDayOfMonth.get("day");
            const lastDayOfMonth = firstDayOfMonth.add(1, "month").prev("day");
            const lastDayOfWeek = lastDayOfMonth.get("day");
            const skipFirstWeek = firstDayOfWeek >= 4 && firstDayOfWeek <= 6;
            const daysSinceFirstSunday = (date.get("date") - 1) + firstDayOfWeek;
            const weekNumber = Math.floor(daysSinceFirstSunday / 7) + (skipFirstWeek ? 0 : 1);
            const today = cdate();
            const isToday = date.format("YYYY-MM-DD") === today.format("YYYY-MM-DD");

            let displayText = `${date.get("date")}`;
            if (cellWidth <= 5) {
              displayText = '';
            } else if (cellWidth <= 11) {
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
                    zIndex: '-1'
                  }}
                >
                  <label
                    style={{
                      position: 'absolute',
                      zIndex: '1',
                      whiteSpace: 'nowrap',
                      letterSpacing: cellWidth <= 14 ? '-2px' : 'normal',
                      marginLeft: cellWidth <= 14 ? '-2px' : '0px',
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
                      backgroundColor: 'rgba(255, 255, 0, 0.15)',
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