// App.tsx
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RootState } from './reduxStoreAndSlices/store';
import { ChartRow, EventRow, SeparatorRow } from './types/DataTypes';
import WBSInfo from './components/Table/WBSInfo';
import ChartRowComponent from './components/Chart/ChartRowComponent';
import EventRowComponent from './components/Chart/EventRowComponent';
import SeparatorRowComponent from './components/Chart/SeparatorRowComponent';
import Calendar from './components/Chart/Calendar';
import { useSelector, useDispatch } from 'react-redux';
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

const selectWbsData = (state: RootState) => state.wbsData;
const selectUndoRedo = createSelector(
  [selectWbsData],
  (wbsData) => ({
    pastState: wbsData.past,
    presentState: wbsData.present,
    futureState: wbsData.future,
  })
);

function App() {
  const dispatch = useDispatch();
  const data = useSelector(
    (state: RootState) => state.wbsData.present.data,
    (prevData, nextData) => isEqual(prevData, nextData)
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
  const dateArray = useMemo(() => generateDates(dateRange.startDate, dateRange.endDate), [dateRange]);
  const [isGridRefDragging, setIsGridRefDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [canGridRefDrag, setCanGridRefDrag] = useState(true);
  const [startX, setStartX] = useState({ eventX: 0, gridRefX: 0 });
  const [startY, setStartY] = useState({ eventY: 0, gridRefY: 0 });
  const [separatorX, setSeparatorX] = useState(0);
  const [gridHeight, setGridHeight] = useState<number>(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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
    const isChromiumBased = /Chrome/.test(navigator.userAgent) || /Chromium/.test(navigator.userAgent);
    if (!isChromiumBased) {
      alert('This application only works correctly in Chromium-based browsers. It may not function properly in other browsers, so please access it using a Chromium-based browser(e.g. Chrome, Edge).');
    }
  }, []);

  const handleVerticalScroll = useCallback((sourceRef: React.RefObject<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement>) => {
    if (!isGridRefDragging) {
      setIsGridRefDragging(true);
    }
    if (sourceRef.current && targetRef.current && gridRef.current) {
      const scrollTop = Math.min(sourceRef.current.scrollTop, gridRef.current.scrollHeight - sourceRef.current.clientHeight);
      targetRef.current.scrollTop = scrollTop;
      sourceRef.current.scrollTop = scrollTop;
    }
  }, [isGridRefDragging]);

  const handleHorizontalScroll = useCallback((sourceRef: React.RefObject<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement>) => {
    if (!isGridRefDragging) {
      setIsGridRefDragging(true);
    }
    if (sourceRef.current && targetRef.current) {
      const maxScrollLeftSource = sourceRef.current.scrollWidth - sourceRef.current.clientWidth;
      const maxScrollLeftTarget = targetRef.current.scrollWidth - targetRef.current.clientWidth;
      const scrollLeft = Math.min(sourceRef.current.scrollLeft, maxScrollLeftSource, maxScrollLeftTarget);
      targetRef.current.scrollLeft = scrollLeft;
      sourceRef.current.scrollLeft = scrollLeft;
    }
  }, [isGridRefDragging]);

  useEffect(() => {
    const wbsElement = wbsRef.current;
    const calendarElement = calendarRef.current;
    const gridElement = gridRef.current;

    const wbsHandleVertical = () => {
      handleVerticalScroll(wbsRef, gridRef);
    };
    const gridHandleVertical = () => {
      handleVerticalScroll(gridRef, wbsRef);
    };
    if (wbsElement && gridElement) {
      wbsElement.addEventListener('scroll', wbsHandleVertical);
      gridElement.addEventListener('scroll', gridHandleVertical);
    }

    const gridHandleHorizontal = () => handleHorizontalScroll(gridRef, calendarRef);
    if (calendarElement && gridElement) {
      gridElement.addEventListener('scroll', gridHandleHorizontal);
    }

    return () => {
      if (wbsElement && gridElement) {
        wbsElement.removeEventListener('scroll', wbsHandleVertical);
        gridElement.removeEventListener('scroll', gridHandleVertical);
      }
      if (gridElement) {
        gridElement.removeEventListener('scroll', gridHandleHorizontal);
      }
    };
  }, [handleHorizontalScroll, handleVerticalScroll, isGridRefDragging]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    setIsMouseDown(true);
    if (canGridRefDrag && gridRef.current) {
      setStartX({ eventX: event.clientX + gridRef.current.scrollLeft, gridRefX: gridRef.current.scrollLeft });
      setStartY({ eventY: event.clientY + gridRef.current.scrollTop, gridRefY: gridRef.current.scrollTop });
    }
  }, [canGridRefDrag]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!gridRef.current) return;

    if (canGridRefDrag && isMouseDown) {
      const currentScrollLeft = gridRef.current.scrollLeft;
      const currentScrollTop = gridRef.current.scrollTop;
      const newScrollLeft = startX.eventX - event.clientX;
      const newScrollTop = startY.eventY - event.clientY;
      if (newScrollLeft !== currentScrollLeft) {
        gridRef.current.scrollLeft = newScrollLeft;
      }
      if (newScrollTop !== currentScrollTop) {
        gridRef.current.scrollTop = newScrollTop;
      }
    } else if (!isGridRefDragging) {
      const gridStartX = (gridRef.current.scrollLeft - wbsWidth) % cellWidth;
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      let adjustedY = mousePosition.y
      if (canGridRefDrag) {
        const gridStartY = gridRef.current.scrollTop % 21;
        adjustedY = Math.floor((event.clientY + gridStartY) / 21) * 21 - gridStartY;
      }
      setMousePosition({ x: adjustedX, y: adjustedY });
    } else {
      setIsGridRefDragging(false);
      setSeparatorX(gridRef.current.scrollLeft);
    }
  }, [canGridRefDrag, cellWidth, isGridRefDragging, isMouseDown, mousePosition.y, startX.eventX, startY.eventY, wbsWidth]);

  const handleMouseUp = useCallback(() => {
    setIsGridRefDragging(false);
    setIsMouseDown(false);
    if (!gridRef.current) return;
    setSeparatorX(gridRef.current.scrollLeft);
  }, []);

  const handleResize = useCallback((newWidth: number) => {
    const adjustedWidth = Math.max(0, Math.min(newWidth, maxWbsWidth));
    dispatch(setWbsWidth(adjustedWidth));
  }, [dispatch, maxWbsWidth]);

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
        <div style={{ position: 'absolute', left: `${wbsWidth}px`, width: `calc(100vw - ${wbsWidth}px)`, height: '100vh', overflow: 'hidden', borderLeft: '1px solid #00000066', scrollBehavior: 'auto' }} ref={calendarRef}>
          <Calendar
            dateArray={dateArray}
          />
          <GridVertical dateArray={dateArray} gridHeight={gridHeight} />
        </div>
        <div className="hiddenScrollbar" style={{ position: 'absolute', top: '21px', width: `${wbsWidth}px`, height: `calc(100vh - 33px)`, overflowX: 'scroll', scrollBehavior: 'auto' }} ref={wbsRef}>
          <WBSInfo
            headerRow={headerRow}
            visibleColumns={visibleColumns}
          />
        </div>
        <ResizeBar onDrag={handleResize} initialWidth={wbsWidth} />

        <div style={{ position: 'absolute', top: '42px', left: `${wbsWidth}px`, width: `calc(100vw - ${wbsWidth}px)`, height: `calc(100vh - 41px)`, overflow: 'scroll', borderLeft: '1px solid transparent', scrollBehavior: 'auto' }} ref={gridRef}>
          {Object.entries(data).map(([key, entry]) => {
            if (entry.rowType === 'Chart') {
              return (
                <ChartRowComponent
                  key={key}
                  entry={entry as ChartRow}
                  dateArray={dateArray}
                  gridRef={gridRef}
                  setCanGridRefDrag={setCanGridRefDrag}
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
                  setCanGridRefDrag={setCanGridRefDrag}
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

      {!isSettingsModalOpen && !isGridRefDragging && (
        <>
          {(mousePosition.y > 41 && window.innerHeight - mousePosition.y > 36) && (
            <div
              className="horizontal-indicator"
              style={{
                width: '100vw',
                height: '0.2px',
                backgroundColor: 'rgba(59, 42, 255, 0.609)',
                position: 'absolute',
                left: 0,
                top: `${mousePosition.y + 20}px`,
                pointerEvents: 'none',
                zIndex: '20'
              }}
            ></div>
          )}
          {(mousePosition.x > wbsWidth) && (cellWidth > 5) && (
            <div
              className="vertical-indicator"
              style={{
                height: `${gridHeight + 21}px`,
                width: `${cellWidth + 0.2}px`,
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