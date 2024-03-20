// App.tsx
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, undo, redo } from './reduxStoreAndSlices/store';
import { setWbsWidth, setMaxWbsWidth } from './reduxStoreAndSlices/baseSettingsSlice';
import { isChartRow, isEventRow, isSeparatorRow } from './types/DataTypes';
import Calendar from './components/Chart/Calendar';
import GridVertical from './components/Chart/GridVertical';
import ChartRowComponent from './components/Chart/ChartRowComponent';
import EventRowComponent from './components/Chart/EventRowComponent';
import SeparatorRowComponent from './components/Chart/SeparatorRowComponent';
import ResizeBar from './components/WbsWidthResizer';
import WBSInfo from './components/Table/WBSInfo';
import SeparatorRowLabelComponent from './components/Table/SeparatorRowLabel';
import SettingButton from './components/Setting/SettingButton';
import SettingsModal from './components/Setting/SettingsModal';
import TitleSetting from './components/Setting/TitleSetting';
import { generateDates } from './components/Chart/utils/CalendarUtil';
import "./components/Table/css/ReactGrid.css";
import "./components/Table/css/HiddenScrollBar.css";

function App() {
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.wbsData.data);
  const pastLength = useSelector((state: RootState) => state.wbsData.past.length);
  const futureLength = useSelector((state: RootState) => state.wbsData.future.length);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const maxWbsWidth = useSelector((state: RootState) => state.baseSettings.maxWbsWidth);
  const dateRange = useSelector((state: RootState) => state.baseSettings.dateRange);
  const columns = useSelector((state: RootState) => state.wbsData.columns);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGridRefDragging, setIsGridRefDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [canGridRefDrag, setCanGridRefDrag] = useState(true);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [gridHeight, setGridHeight] = useState<number>(0);
  const [indicatorPosition, setIndicatorPosition] = useState({ x: 0, y: 0 });
  const [visibleRange, setVisibleRange] = useState({ startIndex: 0, endIndex: 200 });
  const wbsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragTimeoutRef = useRef<number | null>(null);
  const prevIndicatorRef = useRef({ x: 0, y: 0 });
  const prevCellWidthRef = useRef(cellWidth);
  const prevStartIndexRef = useRef(0);
  const dateArray = useMemo(() => generateDates(dateRange.startDate, dateRange.endDate), [dateRange]);
  const rowHeight = 21;
  const renderRowsInterval = 30;
  const visibleRows = useMemo(() => Math.ceil(gridHeight / rowHeight), [gridHeight]);
  const totalRows = useMemo(() => Object.keys(data).length, [data]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button === 0) {
      setIsMouseDown(true);
      if (canGridRefDrag && gridRef.current) {
        setStartX(event.clientX + gridRef.current.scrollLeft);
        setStartY(event.clientY + gridRef.current.scrollTop);
      }
    }
  }, [canGridRefDrag]);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    if (!gridRef.current) return;
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!gridRef.current) return;

    if (canGridRefDrag && isMouseDown) {
      const currentScrollLeft = gridRef.current.scrollLeft;
      const currentScrollTop = gridRef.current.scrollTop;
      const newScrollLeft = startX - event.clientX;
      const newScrollTop = startY - event.clientY;
      if (newScrollLeft !== currentScrollLeft) {
        gridRef.current.scrollLeft = newScrollLeft;
      }
      if (newScrollTop !== currentScrollTop) {
        gridRef.current.scrollTop = newScrollTop;
      }
      const gridStartX = (gridRef.current.scrollLeft - wbsWidth) % cellWidth;
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      let adjustedY = indicatorPosition.y
      if (canGridRefDrag) {
        const gridStartY = gridRef.current.scrollTop % 21;
        adjustedY = Math.floor((event.clientY + gridStartY + 1) / 21) * 21 - gridStartY;
      }
      if (prevIndicatorRef.current.x !== adjustedX || prevIndicatorRef.current.y !== adjustedY) {
        setIndicatorPosition({ x: adjustedX, y: adjustedY });
        prevIndicatorRef.current = { x: adjustedX, y: adjustedY };
      }
    } else if (!isGridRefDragging) {
      const gridStartX = (gridRef.current.scrollLeft - wbsWidth) % cellWidth;
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      let adjustedY = indicatorPosition.y
      if (canGridRefDrag) {
        const gridStartY = gridRef.current.scrollTop % 21;
        adjustedY = Math.floor((event.clientY + gridStartY + 1) / 21) * 21 - gridStartY;
      }
      if (prevIndicatorRef.current.x !== adjustedX || prevIndicatorRef.current.y !== adjustedY) {
        setIndicatorPosition({ x: adjustedX, y: adjustedY });
        prevIndicatorRef.current = { x: adjustedX, y: adjustedY };
      }
    } else if (isGridRefDragging && !isMouseDown) {
      setIsGridRefDragging(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGridRefDrag, cellWidth, isGridRefDragging, isMouseDown, startX, startY, wbsWidth]);

  const resetDragTimeout = useCallback(() => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    dragTimeoutRef.current = setTimeout(() => {
      if (dragTimeoutRef.current !== null) {
        clearTimeout(dragTimeoutRef.current);
      }
      setIsGridRefDragging(false);
    }, 80);
  }, []);

  const handleVerticalScroll = useCallback((sourceRef: React.RefObject<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement>) => {
    if (!isGridRefDragging) {
      setIsGridRefDragging(true);
    }
    if (sourceRef.current && targetRef.current && gridRef.current) {
      const scrollTop = Math.min(sourceRef.current.scrollTop, gridRef.current.scrollHeight - sourceRef.current.clientHeight);
      targetRef.current.scrollTop = scrollTop;
      sourceRef.current.scrollTop = scrollTop;
      if (isMouseDown) {
        resetDragTimeout();
      }
      const rawStartIndex = Math.floor(gridRef.current.scrollTop / rowHeight) - renderRowsInterval;
      const adjustedStartIndex = Math.max(0, rawStartIndex);
      const startIndex = adjustedStartIndex >= renderRowsInterval ? adjustedStartIndex : 0;
      const rawEndIndex = startIndex + visibleRows + (renderRowsInterval * 2);
      const endIndex = Math.min(totalRows - 1, rawEndIndex);
      if ((Math.abs(startIndex - prevStartIndexRef.current) >= renderRowsInterval)) {
        setVisibleRange({ startIndex, endIndex });
        prevStartIndexRef.current = startIndex;
      }
    }
  }, [isGridRefDragging, isMouseDown, resetDragTimeout, totalRows, visibleRows]);

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
      if (isMouseDown) {
        resetDragTimeout();
      }
    }
  }, [isGridRefDragging, isMouseDown, resetDragTimeout]);

  useEffect(() => {
    const isChromiumBased = /Chrome/.test(navigator.userAgent) || /Chromium/.test(navigator.userAgent);
    if (!isChromiumBased) {
      alert('This application only works correctly in Chromium-based browsers. It may not function properly in other browsers, so please access it using a Chromium-based browser(e.g. Chrome, Edge).');
    }
  }, []);

  useEffect(() => {
    if (cellWidth !== prevCellWidthRef.current && gridRef.current) {
      const mouseX = prevIndicatorRef.current.x;
      const relativeMouseX = mouseX - gridRef.current.getBoundingClientRect().left + gridRef.current.scrollLeft;
      const scale = cellWidth / prevCellWidthRef.current;
      const newScrollLeft = (relativeMouseX * scale) - (mouseX - gridRef.current.getBoundingClientRect().left);
      gridRef.current.scrollLeft = newScrollLeft;
      prevCellWidthRef.current = cellWidth;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellWidth]);

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
    const gridHandleHorizontal = () => {
      handleHorizontalScroll(gridRef, calendarRef)
    };
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

  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !isSettingsModalOpen) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            dispatch(undo());
            break;
          case 'y':
            event.preventDefault();
            dispatch(redo());
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
  }, [dispatch, isSettingsModalOpen]);

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
          {Object.entries(data).map(([key, entry], index) => {
            if (isSeparatorRow(entry) && gridRef.current) {
              if (index >= visibleRange.startIndex && index <= visibleRange.endIndex) {
                return (
                  <SeparatorRowLabelComponent
                    key={key}
                    entry={entry}
                  />
                );
              } else {
                return null;
              }
            }
          })}
          <WBSInfo />
        </div>

        <ResizeBar />

        <div style={{ position: 'absolute', top: '42px', left: `${wbsWidth}px`, width: `calc(100vw - ${wbsWidth}px)`, height: `calc(100vh - 41px)`, overflow: 'scroll', borderLeft: '1px solid transparent', scrollBehavior: 'auto' }} ref={gridRef}>
          <div style={{ height: `${(Object.keys(data).length * rowHeight) - 31}px` }}>
            {Object.entries(data).map(([key, entry], index) => {
              if (gridRef.current) {
                if (index >= visibleRange.startIndex && index <= visibleRange.endIndex) {
                  if (isChartRow(entry)) {
                    return (
                      <ChartRowComponent
                        key={key}
                        entry={entry}
                        dateArray={dateArray}
                        gridRef={gridRef}
                        setCanGridRefDrag={setCanGridRefDrag}
                      />
                    );
                  } else if (isSeparatorRow(entry)) {
                    return (
                      <SeparatorRowComponent
                        key={key}
                        entry={entry}
                      />
                    );
                  } else if (isEventRow(entry)) {
                    return (
                      <EventRowComponent
                        key={key}
                        entry={entry}
                        dateArray={dateArray}
                        gridRef={gridRef}
                        setCanGridRefDrag={setCanGridRefDrag}
                      />
                    );
                  }
                }
                return null;
              }
            })}
          </div>
        </div>
        <div style={{ position: 'fixed', bottom: '0px', left: '3px', fontSize: '0.6rem' }}>
          <div>Undo: {pastLength - 1}, Redo: {futureLength}</div>
        </div>
      </div>

      {!isSettingsModalOpen && !isGridRefDragging && (
        <>
          {(indicatorPosition.y > 41 && window.innerHeight - indicatorPosition.y > 36) && (
            <div
              className="horizontal-indicator"
              style={{
                width: '100vw',
                height: '0.5px',
                backgroundColor: 'rgba(59, 42, 255, 0.609)',
                position: 'absolute',
                left: 0,
                top: `${indicatorPosition.y + rowHeight - 1}px`,
                pointerEvents: 'none',
                zIndex: '20'
              }}
            ></div>
          )}
          {(indicatorPosition.x > wbsWidth) && (cellWidth > 5) && (
            <div
              className="vertical-indicator"
              style={{
                height: `${gridHeight + rowHeight}px`,
                width: `${cellWidth + 1}px`,
                backgroundColor: 'rgba(124, 124, 124, 0.09)',
                position: 'absolute',
                left: indicatorPosition.x + 'px',
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

export default App