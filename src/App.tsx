// App.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import Calendar from './components/Chart/Calendar';
import { ChartRow, EventRow, SeparatorRow } from './types/DataTypes';
import WBSInfo from './components/Table/WBSInfo';
import ChartRowComponent from './components/Chart/ChartRowComponent';
import EventRowComponent from './components/Chart/EventRowComponent';
import SeparatorRowComponent from './components/Chart/SeparatorRowComponent';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './reduxStoreAndSlices/store';
import { setWbsWidth, setMaxWbsWidth } from './reduxStoreAndSlices/baseSettingsSlice';
import { generateDates } from './components/Chart/utils/CalendarUtil';
import GridVertical from './components/Chart/GridVertical';
import { ResizeBar } from './components/WbsWidthResizer';
import "./components/Table/css/ReactGrid.css";
import "./components/Table/css/HiddenScrollBar.css";
import SettingButton from './components/Setting/SettingButton';
import SettingsModal from './components/Setting/SettingsModal';
import { useWBSData } from './components/Table/hooks/useWBSData';
import { ActionCreators } from 'redux-undo';
import TitleSetting from './components/Setting/TitleSetting';
import { isEqual } from 'lodash';
import { createSelector } from '@reduxjs/toolkit';

function App() {
  const dispatch = useDispatch();
  const data = useSelector(
    (state: RootState) => state.wbsData.present.data,
    (prevData, nextData) => isEqual(prevData, nextData)
  );
  const selectWbsData = (state: RootState) => state.wbsData;
  const selectUndoRedo = createSelector(
    [selectWbsData],
    (wbsData) => ({
      pastState: wbsData.past,
      presentState: wbsData.present,
      futureState: wbsData.future,
    })
  );
  const { pastState, presentState, futureState } = useSelector(selectUndoRedo);
  const [actualUndoCount, setActualUndoCount] = useState(0);
  const [actualRedoCount, setActualRedoCount] = useState(0);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const maxWbsWidth = useSelector((state: RootState) => state.baseSettings.maxWbsWidth);
  const dateRange = useSelector((state: RootState) => state.baseSettings.dateRange);
  const columns = useSelector((state: RootState) => state.wbsData.present.columns);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const { headerRow, visibleColumns } = useWBSData();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [dateArray, setDateArray] = useState(generateDates(dateRange.startDate, dateRange.endDate));
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [canDrag, setCanDrag] = useState(true);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [separatorX, setSeparatorX] = useState(0);
  const wbsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const totalWidth = columns.reduce((sum, column) => {
      const columnWidth = column.width !== undefined ? column.width : 150;
      return column.visible ? sum + columnWidth : sum;
    }, 0);
    if (columns.length > 0) {
      const widthDifference = Math.abs(maxWbsWidth - wbsWidth);

      if (wbsWidth > totalWidth || widthDifference <= 20) {
        dispatch(setWbsWidth(totalWidth));
      }
    }
    dispatch(setMaxWbsWidth(totalWidth));
  }, [columns, dispatch, maxWbsWidth, wbsWidth]);

  useEffect(() => {
    setDateArray(generateDates(dateRange.startDate, dateRange.endDate));
  }, [dateRange]);

  useEffect(() => {
    const isChromiumBased = /Chrome/.test(navigator.userAgent) || /Chromium/.test(navigator.userAgent);
    if (!isChromiumBased) {
      alert('This application only works correctly in Chromium-based browsers. It may not function properly in other browsers, so please access it using a Chromium-based browser(e.g. Chrome, Edge).');
    }
  }, []);

  useEffect(() => {
    const handleVerticalScroll = (sourceRef: React.RefObject<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement>) => {
      if (sourceRef.current && targetRef.current) {
        const maxScrollTopSource = sourceRef.current.scrollHeight - sourceRef.current.clientHeight;
        const maxScrollTopTarget = targetRef.current.scrollHeight - targetRef.current.clientHeight;
        const scrollTop = Math.min(sourceRef.current.scrollTop, maxScrollTopSource, maxScrollTopTarget);
        targetRef.current.scrollTop = scrollTop;
        sourceRef.current.scrollTop = scrollTop;
      }
    };

    const handleHorizontalScroll = (sourceRef: React.RefObject<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement>) => {
      if (sourceRef.current && targetRef.current) {
        const maxScrollLeftSource = sourceRef.current.scrollWidth - sourceRef.current.clientWidth;
        const maxScrollLeftTarget = targetRef.current.scrollWidth - targetRef.current.clientWidth;
        const scrollLeft = Math.min(sourceRef.current.scrollLeft, maxScrollLeftSource, maxScrollLeftTarget);
        targetRef.current.scrollLeft = scrollLeft;
        sourceRef.current.scrollLeft = scrollLeft;
        setSeparatorX(scrollLeft);
      }
    };

    const wbsElement = wbsRef.current;
    const calendarElement = calendarRef.current;
    const gridElement = gridRef.current;

    if (wbsElement && gridElement) {
      wbsElement.addEventListener('scroll', () => handleVerticalScroll(wbsRef, gridRef));
      gridElement.addEventListener('scroll', () => handleVerticalScroll(gridRef, wbsRef));
    }

    if (calendarElement && gridElement) {
      calendarElement.addEventListener('scroll', () => handleHorizontalScroll(calendarRef, gridRef));
      gridElement.addEventListener('scroll', () => handleHorizontalScroll(gridRef, calendarRef));
    }

    return () => {
      if (wbsElement && gridElement) {
        wbsElement.removeEventListener('scroll', () => handleVerticalScroll(wbsRef, gridRef));
        gridElement.removeEventListener('scroll', () => handleVerticalScroll(gridRef, wbsRef));
      }
      if (calendarElement && gridElement) {
        calendarElement.removeEventListener('scroll', () => handleHorizontalScroll(calendarRef, gridRef));
        gridElement.removeEventListener('scroll', () => handleHorizontalScroll(gridRef, calendarRef));
      }
    };
  }, []);


  const handleResize = useCallback((newWidth: number) => {
    const adjustedWidth = Math.max(0, Math.min(newWidth, maxWbsWidth));
    dispatch(setWbsWidth(adjustedWidth));
  }, [dispatch, maxWbsWidth]);

  const calculateGridHeight = () => {
    const rowCount = Object.keys(data).length;
    const maxGridHeight = window.innerHeight - 41;
    const dynamicGridHeight = rowCount * 21;
    return rowCount * 21 < window.innerHeight - 41 ? dynamicGridHeight : maxGridHeight;
  };

  const handleMouseDown = useCallback((event: MouseEvent) => {
    setIsMouseDown(true);
    if (canDrag && gridRef.current) {
      setStartX(event.clientX + gridRef.current.scrollLeft);
      setStartY(event.clientY + gridRef.current.scrollTop);
    }
  }, [canDrag]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (canDrag && isMouseDown && gridRef.current) {
      const moveX = Math.abs(startX - event.clientX - gridRef.current.scrollLeft);
      const moveY = Math.abs(startY - event.clientY - gridRef.current.scrollTop);
      if (moveX > 5 || moveY > 5) {
        setIsDragging(true);
      }
      gridRef.current.scrollLeft = startX - event.clientX;
      gridRef.current.scrollTop = startY - event.clientY;
    }
  }, [canDrag, isMouseDown, startX, startY]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsMouseDown(false);
  }, []);

  useEffect(() => {
    const gridElement = gridRef.current;
    if (gridElement) {
      gridElement.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        gridElement.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function hasDataChanges(prev: any, next: any): boolean {
    const isDataChanged = JSON.stringify(prev.data) !== JSON.stringify(next.data);
    const isColumnsChanged = JSON.stringify(prev.columns) !== JSON.stringify(next.columns);
    return isDataChanged || isColumnsChanged;
  }

  useEffect(() => {
    const handleCustomUndo = () => {
      const pastLength = pastState.length;
      let undoIndex = -1;
      for (let i = pastLength - 1; i >= 0; i--) {
        if (pastState[i].isFixedData && hasDataChanges(pastState[i], presentState)) {
          undoIndex = i;
          break;
        }
      }
      if (undoIndex !== -1) {
        const undoSteps = pastLength - undoIndex;
        for (let i = 0; i < undoSteps; i++) {
          dispatch(ActionCreators.undo());
        }
      }
    };

    const handleCustomRedo = () => {
      const futureLength = futureState.length;
      let redoIndex = -1;
      for (let i = 0; i < futureLength; i++) {
        if (futureState[i].isFixedData && hasDataChanges(futureState[i], presentState)) {
          redoIndex = i;
          break;
        }
      }
      if (redoIndex !== -1) {
        const redoSteps = redoIndex + 1;
        for (let i = 0; i < redoSteps; i++) {
          dispatch(ActionCreators.redo());
        }
      }
    };

    const calculateActualUndoRedoCounts = () => {
      let actualUndoCount = 0;
      let actualRedoCount = 0;

      for (let i = pastState.length - 1; i >= 0; i--) {
        if (pastState[i].isFixedData && hasDataChanges(pastState[i], presentState)) {
          actualUndoCount++;
        }
      }
      for (let i = 0; i < futureState.length; i++) {
        if (futureState[i].isFixedData && hasDataChanges(futureState[i], presentState)) {
          actualRedoCount++;
        }
      }
      setActualUndoCount(actualUndoCount);
      setActualRedoCount(actualRedoCount);
    };

    calculateActualUndoRedoCounts();

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !isSettingsModalOpen) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            handleCustomUndo();
            break;
          case 'y':
            event.preventDefault();
            handleCustomRedo();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, futureState, isSettingsModalOpen, pastState, presentState]);

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gridRef.current) {
        const gridStartX = (gridRef.current.scrollLeft - wbsWidth) % cellWidth;
        const adjustedX = Math.floor((e.clientX + gridStartX - 1.5) / cellWidth) * cellWidth - gridStartX + 1.5;
        let adjustedY = mousePosition.y;
        if (canDrag) {
          const gridStartY = gridRef.current.scrollTop % 21;
          adjustedY = Math.floor((e.clientY + gridStartY) / 21) * 21 - gridStartY;
        }
        setMousePosition(({ x: adjustedX, y: adjustedY }));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cellWidth, isMouseDown, wbsWidth, mousePosition.y, canDrag]);


  return (
    <div style={{ position: 'fixed' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '0px', width: `${wbsWidth}px`, overflow: 'hidden' }} ref={calendarRef}>
          <SettingButton onClick={openSettingsModal} />
          <SettingsModal
            show={isSettingsModalOpen}
            onClose={closeSettingsModal}
          />
          <TitleSetting />
        </div>
        <div style={{ position: 'absolute', left: `${wbsWidth}px`, width: `calc(100vw - ${wbsWidth}px)`, height: '100vh', overflow: 'hidden', borderLeft: '1px solid #00000066' }} ref={calendarRef}>
          <Calendar
            dateArray={dateArray}
          />
          <GridVertical dateArray={dateArray} gridHeight={calculateGridHeight()} />
        </div>
        <div className="hiddenScrollbar" style={{ position: 'absolute', top: '21px', width: `${wbsWidth}px`, height: `calc(100vh - 33px)`, overflowX: 'scroll' }} ref={wbsRef}>
          <WBSInfo
            headerRow={headerRow}
            visibleColumns={visibleColumns}
          />
        </div>
        <ResizeBar onDrag={handleResize} initialWidth={wbsWidth} />
        <div style={{ position: 'absolute', top: '42px', left: `${wbsWidth}px`, width: `calc(100vw - ${wbsWidth}px)`, height: `calc(100vh - 41px)`, overflow: 'scroll', borderLeft: '1px solid transparent' }} ref={gridRef}>
          {Object.entries(data).map(([key, entry]) => {
            if (entry.rowType === 'Chart') {
              return (
                <ChartRowComponent
                  key={key}
                  entry={entry as ChartRow}
                  dateArray={dateArray}
                  gridRef={gridRef}
                  setCanDrag={setCanDrag}
                />
              );
            } else if (entry.rowType === 'Separator') {
              return (
                <SeparatorRowComponent
                  key={key}
                  entry={entry as SeparatorRow}
                  separatorX={separatorX}
                  wbsWidth={wbsWidth}
                />
              );
            } else if (entry.rowType === 'Event') {
              return (
                <EventRowComponent
                  key={key}
                  entry={entry as EventRow}
                  dateArray={dateArray}
                  gridRef={gridRef}
                  setCanDrag={setCanDrag}
                />
              );
            }
            return null;
          })}
        </div>
        <div style={{ position: 'fixed', bottom: '0px', left: '3px', fontSize: '0.6rem' }}>
          <div>Undo: {actualUndoCount}, Redo: {actualRedoCount}</div>
        </div>
      </div>

      {!isSettingsModalOpen && !isDragging && (
        <>
          <div
            className="horizontal-indicator"
            style={{
              width: '100vw',
              height: '21.1px',
              backgroundColor: 'rgba(124, 124, 124, 0.09)',
              position: 'absolute',
              left: 0,
              top: mousePosition.y + 'px',
              pointerEvents: 'none',
              zIndex: '20'
            }}
          ></div>
          {(mousePosition.x > wbsWidth) && (
            <div
              className="vertical-indicator"
              style={{
                height: `${calculateGridHeight() + 21}px`,
                width: `${cellWidth + 0.1}px`,
                backgroundColor: 'rgba(124, 124, 124, 0.09)',
                position: 'absolute',
                left: mousePosition.x + 'px',
                top: '21px',
                pointerEvents: 'none',
                zIndex: '20'
              }}
            ></div>
          )}
        </>
      )}
    </div>
  );
}

export default App;