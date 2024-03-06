// EventRowComponent.tsx
import React, { useState, memo, useEffect, useCallback, useReducer, useMemo } from 'react';
import { EventRow, EventData } from '../../types/DataTypes';
import { useDispatch, useSelector } from 'react-redux';
import { updateEventRow, setIsFixedData, pushPastState, removePastState } from '../../reduxStoreAndSlices/store';
import { formatDate, adjustToLocalMidnight } from './utils/chartHelpers';
import { ChartBar } from './ChartBar';
import ChartBarContextMenu from './ChartBarContextMenu';
import { RootState } from '../../reduxStoreAndSlices/store';
import { GanttRow } from '../../styles/GanttStyles';
// import { throttle } from 'lodash';

type Action =
  | { type: 'INIT'; payload: EventType[] }
  | { type: 'ADD_EVENT'; payload: EventType }
  | { type: 'UPDATE_START_DATE'; payload: { index: number; startDate: Date | null } }
  | { type: 'UPDATE_END_DATE'; payload: { index: number; endDate: Date | null } }
  | { type: 'UPDATE_EVENT_DATES'; payload: { index: number; startDate: Date | null; endDate: Date | null; } }
  | { type: 'UPDATE_DISPLAY_NAME'; payload: { index: number; displayName: string } };

type EventType = {
  startDate: Date | null;
  endDate: Date | null;
  isPlanned: boolean;
  eachDisplayName: string;
};

function eventsReducer(state: EventType[], action: Action): EventType[] {
  switch (action.type) {
    case 'INIT':
      return action.payload;
    case 'ADD_EVENT':
      return [...state, action.payload];
    case 'UPDATE_START_DATE':
      return state.map((event, index) =>
        index === action.payload.index
          ? { ...event, startDate: action.payload.startDate }
          : event
      );
    case 'UPDATE_END_DATE':
      return state.map((event, index) =>
        index === action.payload.index
          ? { ...event, endDate: action.payload.endDate }
          : event
      );
    case 'UPDATE_EVENT_DATES':
      return state.map((event, index) =>
        index === action.payload.index
          ? { ...event, startDate: action.payload.startDate, endDate: action.payload.endDate }
          : event
      );
    case 'UPDATE_DISPLAY_NAME':
      return state.map((event, index) =>
        index === action.payload.index
          ? { ...event, eachDisplayName: action.payload.displayName }
          : event
      );
    default:
      return state;
  }
}

interface EventRowProps {
  entry: EventRow;
  dateArray: Date[];
  gridRef: React.RefObject<HTMLDivElement>;
  setCanGridRefDrag: (canGridRefDrag: boolean) => void;
}

const EventRowComponent: React.FC<EventRowProps> = memo(({ entry, dateArray, gridRef, setCanGridRefDrag }) => {
  const dispatch = useDispatch();
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const topPosition = (entry.no - 1) * 21;
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
  const init = (initialEventData: EventData[]) => initialEventData.map(event => ({
    ...event,
    startDate: event.startDate ? new Date(event.startDate) : null,
    endDate: event.endDate ? new Date(event.endDate) : null,
    isPlanned: event.isPlanned,
    eachDisplayName: event.eachDisplayName
  }));
  const [localEvents, localDispatch] = useReducer(eventsReducer, entry.eventData, init);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isBarDragging, setIsBarDragging] = useState(false);
  const [isBarEndDragging, setIsBarEndDragging] = useState(false);
  const [isBarStartDragging, setIsBarStartDragging] = useState(false);
  const [originalStartDate, setOriginalStartDate] = useState<Date | null>(null);
  const [originalEndDate, setOriginalEndDate] = useState<Date | null>(null);
  const [initialMouseX, setInitialMouseX] = useState<number | null>(null);
  const [activeEventIndex, setActiveEventIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, index: number } | null>(null);

  const handleBarMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>, index: number) => {
    dispatch(pushPastState());
    setIsBarDragging(true);
    setCanGridRefDrag(false);
    if (gridRef.current) {
      const gridStartX = ((gridRef.current.scrollLeft - wbsWidth) % cellWidth);
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      setInitialMouseX(adjustedX);
    }
    setOriginalStartDate(localEvents[index].startDate);
    setOriginalEndDate(localEvents[index].endDate);
    setActiveEventIndex(index);
  }, [cellWidth, dispatch, gridRef, localEvents, setCanGridRefDrag, wbsWidth]);

  const handleBarEndMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>, index: number) => {
    dispatch(pushPastState());
    setIsBarEndDragging(true);
    setCanGridRefDrag(false);
    if (gridRef.current) {
      const gridStartX = ((gridRef.current.scrollLeft - wbsWidth) % cellWidth);
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      setInitialMouseX(adjustedX);
    }
    setOriginalStartDate(localEvents[index].startDate);
    setOriginalEndDate(localEvents[index].endDate);
    setActiveEventIndex(index);
  }, [cellWidth, dispatch, gridRef, localEvents, setCanGridRefDrag, wbsWidth]);

  const handleBarStartMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>, index: number) => {
    dispatch(pushPastState());
    setIsBarStartDragging(true);
    setCanGridRefDrag(false);
    if (gridRef.current) {
      const gridStartX = ((gridRef.current.scrollLeft - wbsWidth) % cellWidth);
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      setInitialMouseX(adjustedX);
    }
    setOriginalStartDate(localEvents[index].startDate);
    setOriginalEndDate(localEvents[index].endDate);
    setActiveEventIndex(index);
  }, [cellWidth, dispatch, gridRef, localEvents, setCanGridRefDrag, wbsWidth]);

  const calculateDateFromX = useCallback((x: number) => {
    const dateIndex = Math.floor(x / cellWidth);
    if (dateIndex < 0) {
      return adjustToLocalMidnight(dateArray[0]);
    } else if (dateIndex >= dateArray.length) {
      return adjustToLocalMidnight(dateArray[dateArray.length - 1]);
    }
    return adjustToLocalMidnight(dateArray[dateIndex]);
  }, [cellWidth, dateArray]);

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(pushPastState());
    setCanGridRefDrag(false);
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const clickedDate = calculateDateFromX(relativeX);
    setIsEditing(true);
    setCurrentDate(clickedDate);
    const isShiftKeyDown = event.shiftKey;
    const newEvent = {
      startDate: clickedDate,
      endDate: clickedDate,
      isPlanned: !isShiftKeyDown,
      eachDisplayName: ""
    };
    localDispatch({ type: 'ADD_EVENT', payload: newEvent });
    setActiveEventIndex(localEvents.length);
  }, [calculateDateFromX, dispatch, localEvents.length, setCanGridRefDrag]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const update = () => {
      if ((isBarDragging || isBarEndDragging || isBarStartDragging) && initialMouseX !== null && activeEventIndex !== null) {
        const currentMouseX = event.clientX;
        let deltaX
        if (isBarDragging) {
          deltaX = currentMouseX - initialMouseX;
        } else if (isBarEndDragging) {
          deltaX = currentMouseX - initialMouseX + cellWidth;
        } else { //(isBarStartDragging)
          deltaX = currentMouseX - initialMouseX - cellWidth;
        }
        const gridSteps = Math.floor(deltaX / cellWidth);

        let newStartDate = originalStartDate ? new Date(originalStartDate.getTime()) : null;
        let newEndDate = originalEndDate ? new Date(originalEndDate.getTime()) : null;

        if (isBarDragging && originalStartDate && originalEndDate && newStartDate && newEndDate) {
          newStartDate.setDate(newStartDate.getDate() + gridSteps);
          newEndDate.setDate(newEndDate.getDate() + gridSteps);
        } else if (isBarEndDragging && originalEndDate && newStartDate && newEndDate && originalStartDate) {
          newEndDate.setDate(newEndDate.getDate() + gridSteps);
          if (newEndDate < originalStartDate) {
            newEndDate = new Date(originalStartDate.getTime());
          }
        } else if (isBarStartDragging && originalStartDate && newStartDate && newEndDate && originalEndDate) {
          newStartDate.setDate(newStartDate.getDate() + gridSteps);
          if (newStartDate > originalEndDate) {
            newStartDate = new Date(originalEndDate.getTime());
          }
        }
        localDispatch({
          type: 'UPDATE_EVENT_DATES',
          payload: { index: activeEventIndex, startDate: newStartDate, endDate: newEndDate }
        });
      } else if (isEditing) {
        const gridRect = gridRef.current?.getBoundingClientRect();
        if (!gridRect || !currentDate || activeEventIndex === null) return;

        const scrollLeft = gridRef.current?.scrollLeft || 0;
        const relativeX = event.clientX - gridRect.left + scrollLeft - 1;
        const newDate = calculateDateFromX(relativeX);

        const isEndDate = newDate > currentDate;
        const newStartDate = (isEndDate ? currentDate : newDate);
        const newEndDate = (isEndDate ? newDate : currentDate);
        localDispatch({
          type: 'UPDATE_EVENT_DATES',
          payload: {
            index: activeEventIndex,
            startDate: newStartDate,
            endDate: newEndDate
          }
        });
      }
    };
    requestAnimationFrame(update);
  }, [isBarDragging, isBarEndDragging, isBarStartDragging, initialMouseX, activeEventIndex, isEditing, cellWidth, originalStartDate, originalEndDate, gridRef, currentDate, calculateDateFromX]);

  useEffect(() => {
    if (!isEditing && !isBarDragging && !isBarEndDragging && !isBarStartDragging) {
      const initializedEvents = entry.eventData.map(event => ({
        ...event,
        startDate: event.startDate ? new Date(event.startDate) : null,
        endDate: event.endDate ? new Date(event.endDate) : null,
      }));
      localDispatch({ type: 'INIT', payload: initializedEvents });
    }
  }, [entry.eventData, isEditing, isBarDragging, isBarEndDragging, isBarStartDragging, dispatch]);

  const syncToStore = useCallback(() => {
    if (isEditing || isBarDragging || isBarEndDragging || isBarStartDragging) {
      const updatedEventData = localEvents.map(event => ({
        ...event,
        startDate: event.startDate ? formatDate(event.startDate) : "",
        endDate: event.endDate ? formatDate(event.endDate) : ""
      }));

      const updatedEventRow = {
        ...entry,
        eventData: updatedEventData
      };

      dispatch(updateEventRow({ id: entry.id, updatedEventRow }));
    }
  }, [isEditing, isBarDragging, isBarEndDragging, isBarStartDragging, localEvents, entry, dispatch]);

  const handleMouseUp = () => {
    let shouldremovePastState = false;
    if (activeEventIndex !== null) {
      if (activeEventIndex !== null && localEvents[activeEventIndex]) {
        const event = localEvents[activeEventIndex];
        const originalStartDateString = originalStartDate ? formatDate(originalStartDate) : null;
        const eventStartDateString = event.startDate ? formatDate(event.startDate) : null;
        const originalEndDateString = originalEndDate ? formatDate(originalEndDate) : null;
        const eventEndDateString = event.endDate ? formatDate(event.endDate) : null;
        shouldremovePastState = (originalStartDateString === eventStartDateString && originalEndDateString === eventEndDateString);
        if (shouldremovePastState) {
          dispatch(removePastState(1));
        }
      }
    }
    syncToStore();
    setIsEditing(false);
    setIsBarDragging(false);
    setIsBarEndDragging(false);
    setIsBarStartDragging(false);
    setInitialMouseX(null);
    setCanGridRefDrag(true);
    dispatch(setIsFixedData(true))
  };

  const handleBarRightClick = useCallback((event: React.MouseEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, index });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDeleteBar = useCallback(() => {
    if (contextMenu !== null) {
      const updatedEventData = localEvents.filter((_, index) => index !== contextMenu.index).map(event => ({
        ...event,
        startDate: event.startDate ? formatDate(event.startDate) : "",
        endDate: event.endDate ? formatDate(event.endDate) : ""
      }));
      const updatedEventRow = {
        ...entry,
        eventData: updatedEventData
      };
      dispatch(updateEventRow({ id: entry.id, updatedEventRow }));
      handleCloseContextMenu();
    }
  }, [contextMenu, localEvents, entry, dispatch, handleCloseContextMenu]);

  return (
    <GanttRow style={{ position: 'absolute', top: `${topPosition}px`, width: `${calendarWidth}px` }} onDoubleClick={handleDoubleClick}>
      {(isEditing || isBarDragging || isBarEndDragging || isBarStartDragging) && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: 'calc(100vh - 12px)', zIndex: 9999, cursor: 'pointer' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      )}
      {localEvents.map((event, index) => (
        <ChartBar
          key={index}
          startDate={event.startDate ? new Date(event.startDate) : null}
          endDate={event.endDate ? new Date(event.endDate) : null}
          dateArray={dateArray}
          isActual={!event.isPlanned}
          entryId={entry.id}
          eventIndex={index}
          chartBarColor={event.isPlanned ? plannedChartBarColor : actualChartBarColor}
          onBarMouseDown={(e) => handleBarMouseDown(e, index)}
          onBarEndMouseDown={(e) => handleBarEndMouseDown(e, index)}
          onBarStartMouseDown={(e) => handleBarStartMouseDown(e, index)}
          onContextMenu={(e) => handleBarRightClick(e, index)}
        />
      ))}
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

export default EventRowComponent;