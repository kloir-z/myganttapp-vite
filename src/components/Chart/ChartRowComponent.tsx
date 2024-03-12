import React, { useState, memo, useEffect, useCallback, useMemo } from 'react';
import { ChartRow } from '../../types/DataTypes';
import { useDispatch } from 'react-redux';
import { setPlannedStartDate, setPlannedEndDate, setPlannedStartAndEndDate, setActualStartDate, setActualEndDate, setActualStartAndEndDate, setIsFixedData, pushPastState, removePastState } from '../../reduxStoreAndSlices/store';
import { addPlannedDays } from './utils/CalendarUtil';
import { ChartBar } from './ChartBar';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import ChartBarContextMenu from './ChartBarContextMenu';
import { GanttRow } from '../../styles/GanttStyles';
import { throttle } from 'lodash';
import { cdate } from 'cdate';

interface ChartRowProps {
  entry: ChartRow;
  dateArray: ReturnType<typeof cdate>[];
  gridRef: React.RefObject<HTMLDivElement>;
  setCanGridRefDrag: (canGridRefDrag: boolean) => void;
}

const ChartRowComponent: React.FC<ChartRowProps> = memo(({ entry, dateArray, gridRef, setCanGridRefDrag }) => {
  const dispatch = useDispatch();
  const topPosition = (entry.no - 1) * 21;
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const colors = useSelector((state: RootState) => state.color.colors);
  const plannedChartBarColor = useMemo(() => {
    if (entry.color === '') { return '#76ff7051'; }
    const colorInfo = colors.find(c => c.alias === entry.color);
    return colorInfo ? colorInfo.color : '#76ff7051';
  }, [entry.color, colors]);
  const actualChartBarColor = useMemo(() => {
    const colorInfo = colors.find(c => c.id === 999);
    return colorInfo ? colorInfo.color : '#0000003d';
  }, [colors]);
  const plannedDays = entry.plannedDays;
  const isIncludeHolidays = entry.isIncludeHolidays
  const holidays = useSelector((state: RootState) => state.wbsData.holidays);
  const regularHolidays = useSelector((state: RootState) => state.wbsData.regularHolidays);
  const [localPlannedStartDate, setLocalPlannedStartDate] = useState(entry.plannedStartDate ? entry.plannedStartDate : null);
  const [localPlannedEndDate, setLocalPlannedEndDate] = useState(entry.plannedEndDate ? entry.plannedEndDate : null);
  const [localActualStartDate, setLocalActualStartDate] = useState(entry.actualStartDate ? entry.actualStartDate : null);
  const [localActualEndDate, setLocalActualEndDate] = useState(entry.actualEndDate ? entry.actualEndDate : null);
  const [currentDate, setCurrentDate] = useState<cdate.CDate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isBarDragging, setIsBarDragging] = useState<'planned' | 'actual' | null>(null);
  const [isBarEndDragging, setIsBarEndDragging] = useState<'planned' | 'actual' | null>(null);
  const [isBarStartDragging, setIsBarStartDragging] = useState<'planned' | 'actual' | null>(null);
  const [originalStartDate, setOriginalStartDate] = useState<string | null>(null);
  const [originalEndDate, setOriginalEndDate] = useState<string | null>(null);
  const [initialMouseX, setInitialMouseX] = useState<number | null>(null);
  const [isShiftKeyDown, setIsShiftKeyDown] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, barType: 'planned' | 'actual' } | null>(null);

  const handleBarMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>, barType: 'planned' | 'actual') => {
    setIsBarDragging(barType);
    setCanGridRefDrag(false);
    dispatch(pushPastState());
    if (gridRef.current) {
      const gridStartX = ((gridRef.current.scrollLeft - wbsWidth) % cellWidth);
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      setInitialMouseX(adjustedX);
    }
    if (barType === 'planned') {
      setOriginalStartDate(localPlannedStartDate);
      setOriginalEndDate(localPlannedEndDate);
    } else { // barType === 'actual'
      setOriginalStartDate(localActualStartDate);
      setOriginalEndDate(localActualEndDate);
    }
  }, [cellWidth, dispatch, gridRef, localActualEndDate, localActualStartDate, localPlannedEndDate, localPlannedStartDate, setCanGridRefDrag, wbsWidth]);

  const handleBarEndMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>, barType: 'planned' | 'actual') => {
    setIsBarEndDragging(barType);
    setCanGridRefDrag(false);
    dispatch(pushPastState());

    if (gridRef.current) {
      const gridStartX = ((gridRef.current.scrollLeft - wbsWidth) % cellWidth);
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      setInitialMouseX(adjustedX);
    }
    if (barType === 'planned') {
      setOriginalEndDate(localPlannedEndDate);
    } else { // barType === 'actual'
      setOriginalStartDate(localActualStartDate);
      setOriginalEndDate(localActualEndDate);
    }
  }, [cellWidth, dispatch, gridRef, localActualEndDate, localActualStartDate, localPlannedEndDate, setCanGridRefDrag, wbsWidth]);

  const handleBarStartMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>, barType: 'planned' | 'actual') => {
    setIsBarStartDragging(barType);
    setCanGridRefDrag(false);
    dispatch(pushPastState());

    if (gridRef.current) {
      const gridStartX = ((gridRef.current.scrollLeft - wbsWidth) % cellWidth);
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      setInitialMouseX(adjustedX);
    }
    if (barType === 'planned') {
      setOriginalStartDate(localPlannedStartDate);
    } else { // barType === 'actual'
      setOriginalStartDate(localActualStartDate);
      setOriginalEndDate(localActualEndDate);
    }
  }, [cellWidth, dispatch, gridRef, localActualEndDate, localActualStartDate, localPlannedStartDate, setCanGridRefDrag, wbsWidth]);

  const calculateDateFromX = useCallback((x: number) => {
    const dateIndex = Math.floor(x / cellWidth);
    if (dateIndex < 0) {
      return dateArray[0].startOf('day');
    } else if (dateIndex >= dateArray.length) {
      return dateArray[dateArray.length - 1].startOf('day');
    }
    return dateArray[dateIndex].startOf('day');
  }, [cellWidth, dateArray]);

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    setCanGridRefDrag(false);
    dispatch(pushPastState());
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const clickedDate = calculateDateFromX(relativeX);
    setIsEditing(true);
    setCurrentDate(clickedDate);
    const isShiftKeyDown = event.shiftKey;
    setIsShiftKeyDown(isShiftKeyDown);

    const setStartDate = isShiftKeyDown ? setLocalActualStartDate : setLocalPlannedStartDate;
    const setEndDate = isShiftKeyDown ? setLocalActualEndDate : setLocalPlannedEndDate;
    setStartDate(clickedDate.format('YYYY/MM/DD'));
    setEndDate(clickedDate.format('YYYY/MM/DD'));
  }, [calculateDateFromX, dispatch, setCanGridRefDrag]);

  const handleMouseMoveEditing = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const update = () => {
      const gridRect = gridRef.current?.getBoundingClientRect();
      if (!gridRect || !currentDate) return;

      const scrollLeft = gridRef.current?.scrollLeft || 0;
      const relativeX = event.clientX - gridRect.left + scrollLeft - 1;
      const newDate = calculateDateFromX(relativeX);

      const isEndDate = newDate > currentDate;
      if (isShiftKeyDown) {
        setLocalActualStartDate(isEndDate ? currentDate.format('YYYY/MM/DD') : newDate.format('YYYY/MM/DD'));
        setLocalActualEndDate(isEndDate ? newDate.format('YYYY/MM/DD') : currentDate.format('YYYY/MM/DD'));
      } else {
        setLocalPlannedStartDate(isEndDate ? currentDate.format('YYYY/MM/DD') : newDate.format('YYYY/MM/DD'));
        setLocalPlannedEndDate(isEndDate ? newDate.format('YYYY/MM/DD') : currentDate.format('YYYY/MM/DD'));
      }
    };
    requestAnimationFrame(update);
  }, [calculateDateFromX, currentDate, gridRef, isShiftKeyDown]);

  const handleMouseMoveBarDragging = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const update = () => {
      if (initialMouseX !== null && originalStartDate && originalEndDate) {
        const currentMouseX = event.clientX;
        const deltaX = currentMouseX - initialMouseX;
        const gridSteps = Math.floor(deltaX / cellWidth);
        const newStartDateString = cdate(originalStartDate).add(gridSteps, 'days').format('YYYY/MM/DD');
        if (isBarDragging === 'planned') {
          setLocalPlannedStartDate(newStartDateString);
          const newEndDate = addPlannedDays(newStartDateString, plannedDays, holidays, isIncludeHolidays, true, regularHolidays);
          setLocalPlannedEndDate(newEndDate);
        } else if (isBarDragging === 'actual') {
          setLocalActualStartDate(newStartDateString);
          const newEndDateString = cdate(originalEndDate).add(gridSteps, 'days').format('YYYY/MM/DD');
          setLocalActualEndDate(newEndDateString);
        }
      }
    };
    requestAnimationFrame(update);
  }, [cellWidth, holidays, initialMouseX, isBarDragging, isIncludeHolidays, originalEndDate, originalStartDate, plannedDays, regularHolidays]);

  const handleMouseMoveBarEndDragging = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const update = () => {
      if (initialMouseX !== null && originalEndDate) {
        const currentMouseX = event.clientX;
        const deltaX = currentMouseX - initialMouseX + cellWidth;
        const gridSteps = Math.floor(deltaX / cellWidth);
        const newEndDateString = cdate(originalEndDate).add(gridSteps, 'days').format('YYYY/MM/DD');
        if (isBarEndDragging === 'planned' && localPlannedStartDate) {
          const isEndDateBeforeStartDate = cdate(newEndDateString) < cdate(localPlannedStartDate);
          setLocalPlannedEndDate(isEndDateBeforeStartDate ? localPlannedStartDate : newEndDateString);
        } else if (isBarEndDragging === 'actual' && localActualStartDate) {
          const isEndDateBeforeStartDate = cdate(newEndDateString) < cdate(localActualStartDate);
          setLocalActualEndDate(isEndDateBeforeStartDate ? localActualStartDate : newEndDateString);
        }
      }
    };
    requestAnimationFrame(update);
  }, [cellWidth, initialMouseX, isBarEndDragging, localActualStartDate, localPlannedStartDate, originalEndDate]);

  const handleMouseMoveBarStartDragging = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const update = () => {
      if (initialMouseX !== null && originalStartDate) {
        const currentMouseX = event.clientX;
        const deltaX = currentMouseX - initialMouseX - cellWidth;
        const gridSteps = Math.floor(deltaX / cellWidth);
        const newStartDateString = cdate(originalStartDate).add(gridSteps, 'days').format('YYYY/MM/DD');
        if (isBarStartDragging === 'planned' && localPlannedEndDate) {
          const isStartDateAfterEndDate = cdate(newStartDateString) > cdate(localPlannedEndDate);
          setLocalPlannedStartDate(isStartDateAfterEndDate ? localPlannedEndDate : newStartDateString);
        } else if (isBarStartDragging === 'actual' && localActualEndDate) {
          const isStartDateAfterEndDate = cdate(newStartDateString) > cdate(localActualEndDate);
          setLocalActualStartDate(isStartDateAfterEndDate ? localActualEndDate : newStartDateString);
        }
      }
    };
    requestAnimationFrame(update);
  }, [cellWidth, initialMouseX, isBarStartDragging, localActualEndDate, localPlannedEndDate, originalStartDate]);

  useEffect(() => {
    if (!isEditing && !isBarDragging && !isBarEndDragging && !isBarStartDragging) {
      setLocalPlannedStartDate(entry.plannedStartDate ? entry.plannedStartDate : null);
      setLocalPlannedEndDate(entry.plannedEndDate ? entry.plannedEndDate : null);
      setLocalActualStartDate(entry.actualStartDate ? entry.actualStartDate : null);
      setLocalActualEndDate(entry.actualEndDate ? entry.actualEndDate : null);
    }
  }, [entry.plannedStartDate, entry.plannedEndDate, entry.actualStartDate, entry.actualEndDate, isEditing, isBarDragging, isBarEndDragging, isBarStartDragging]);

  const syncToStore = useCallback(() => {
    if (isEditing || isBarDragging || isBarEndDragging || isBarStartDragging) {
      if (localPlannedStartDate && localPlannedEndDate) {
        dispatch(setPlannedStartAndEndDate({
          id: entry.id,
          startDate: localPlannedStartDate,
          endDate: localPlannedEndDate
        }));
      } else {
        if (localPlannedStartDate) {
          dispatch(setPlannedStartDate({ id: entry.id, startDate: localPlannedStartDate }));
        }
        if (localPlannedEndDate) {
          dispatch(setPlannedEndDate({ id: entry.id, endDate: localPlannedEndDate }));
        }
      }

      if (localActualStartDate && localActualEndDate) {
        dispatch(setActualStartAndEndDate({
          id: entry.id,
          startDate: localActualStartDate,
          endDate: localActualEndDate
        }));
      } else {
        if (localActualStartDate) {
          dispatch(setActualStartDate({ id: entry.id, startDate: localActualStartDate }));
        }
        if (localActualEndDate) {
          dispatch(setActualEndDate({ id: entry.id, endDate: localActualEndDate }));
        }
      }
    }
  }, [isEditing, isBarDragging, isBarEndDragging, isBarStartDragging, localPlannedStartDate, localPlannedEndDate, localActualStartDate, localActualEndDate, dispatch, entry.id]);

  const throttledSyncToStore = useMemo(() => throttle(syncToStore, 20), [syncToStore]);

  useEffect(() => {
    throttledSyncToStore();
    return () => throttledSyncToStore.cancel();
  }, [throttledSyncToStore]);

  const handleMouseUp = useCallback(() => {
    const isPlannedDrag = isBarDragging === 'planned' || isBarStartDragging === 'planned' || isBarEndDragging === 'planned';
    const isActualDrag = isBarDragging === 'actual' || isBarStartDragging === 'actual' || isBarEndDragging === 'actual';
    let shouldremovePastState = false;
    if (isPlannedDrag) {
      const originalPlannedStartDate = originalStartDate ? originalStartDate : null;
      const originalPlannedEndDate = originalEndDate ? originalEndDate : null;
      const localPlannedStartDateStr = localPlannedStartDate ? localPlannedStartDate : null;
      const localPlannedEndDateStr = localPlannedEndDate ? localPlannedEndDate : null;
      shouldremovePastState = (originalPlannedStartDate === localPlannedStartDateStr && originalPlannedEndDate === localPlannedEndDateStr);
    } else if (isActualDrag) {
      const originalActualStartDate = originalStartDate ? originalStartDate : null;
      const originalActualEndDate = originalEndDate ? originalEndDate : null;
      const localActualStartDateStr = localActualStartDate ? localActualStartDate : null;
      const localActualEndDateStr = localActualEndDate ? localActualEndDate : null;
      shouldremovePastState = (originalActualStartDate === localActualStartDateStr && originalActualEndDate === localActualEndDateStr);
    }
    if (shouldremovePastState) {
      dispatch(removePastState(1));
    }
    syncToStore();
    setIsEditing(false);
    setIsBarDragging(null);
    setIsBarEndDragging(null);
    setIsBarStartDragging(null);
    setInitialMouseX(null);
    setCanGridRefDrag(true)
    dispatch(setIsFixedData(true))
  }, [dispatch, isBarDragging, isBarEndDragging, isBarStartDragging, localActualEndDate, localActualStartDate, localPlannedEndDate, localPlannedStartDate, originalEndDate, originalStartDate, setCanGridRefDrag, syncToStore]);

  const handleBarRightClick = useCallback((event: React.MouseEvent<HTMLDivElement>, barType: 'planned' | 'actual') => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, barType });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDeleteBar = useCallback(() => {
    if (contextMenu !== null) {
      dispatch(pushPastState());
      const { barType } = contextMenu;

      if (barType === 'planned') {
        setLocalPlannedStartDate(null);
        setLocalPlannedEndDate(null);
        dispatch(setPlannedStartDate({ id: entry.id, startDate: '' }));
        dispatch(setPlannedEndDate({ id: entry.id, endDate: '' }));
      } else if (barType === 'actual') {
        setLocalActualStartDate(null);
        setLocalActualEndDate(null);
        dispatch(setActualStartDate({ id: entry.id, startDate: '' }));
        dispatch(setActualEndDate({ id: entry.id, endDate: '' }));
      }

      handleCloseContextMenu();
    }
  }, [contextMenu, dispatch, entry.id, handleCloseContextMenu]);

  return (
    <GanttRow style={{ position: 'absolute', top: `${topPosition}px`, width: `${calendarWidth}px` }} onDoubleClick={handleDoubleClick}>
      {(isEditing || isBarDragging || isBarEndDragging || isBarStartDragging) && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: 'calc(100vh - 12px)', zIndex: 9999, cursor: 'pointer' }}
          onMouseMove={isEditing ? handleMouseMoveEditing : isBarDragging ? handleMouseMoveBarDragging : isBarEndDragging ? handleMouseMoveBarEndDragging : handleMouseMoveBarStartDragging}
          onMouseUp={handleMouseUp}
        />
      )}
      {localPlannedStartDate && localPlannedEndDate && (
        <ChartBar
          startDate={localPlannedStartDate}
          endDate={localPlannedEndDate}
          dateArray={dateArray}
          isActual={false}
          entryId={entry.id}
          chartBarColor={plannedChartBarColor}
          onBarMouseDown={(e) => handleBarMouseDown(e, 'planned')}
          onBarEndMouseDown={(e) => handleBarEndMouseDown(e, 'planned')}
          onBarStartMouseDown={(e) => handleBarStartMouseDown(e, 'planned')}
          onContextMenu={(e) => handleBarRightClick(e, 'planned')}
        />
      )}
      {localActualStartDate && localActualEndDate && (
        <ChartBar
          startDate={localActualStartDate}
          endDate={localActualEndDate}
          dateArray={dateArray}
          isActual={true}
          entryId={entry.id}
          chartBarColor={actualChartBarColor}
          onBarMouseDown={(e) => handleBarMouseDown(e, 'actual')}
          onBarEndMouseDown={(e) => handleBarEndMouseDown(e, 'actual')}
          onBarStartMouseDown={(e) => handleBarStartMouseDown(e, 'actual')}
          onContextMenu={(e) => handleBarRightClick(e, 'actual')}
        />
      )}
      {contextMenu && (
        <ChartBarContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onDelete={handleDeleteBar}
        />
      )}
    </GanttRow>
  );
});

export default ChartRowComponent;