// Gantt.tsx
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, undo, redo, setColumns } from './reduxStoreAndSlices/store';
import { setWbsWidth, setMaxWbsWidth } from './reduxStoreAndSlices/baseSettingsSlice';
import { isChartRow, isEventRow, isSeparatorRow, WBSData } from './types/DataTypes';
import Calendar from './components/Chart/Calendar';
import GridVertical from './components/Chart/GridVertical';
import ChartRowComponent from './components/Chart/ChartRowComponent';
import EventRowComponent from './components/Chart/EventRowComponent';
import SeparatorRowComponent from './components/Chart/SeparatorRowComponent';
import ResizeBar from './components/WbsWidthResizer';
import WBSInfo from './components/Table/WBSInfo';
import SeparatorRowLabelComponent from './components/Table/SeparatorRowLabel';
import SettingButton from './components/Setting/SettingButton';
import TitleSetting from './components/Setting/TitleSetting';
import { generateDates } from './utils/CommonUtils';
import { useTranslation } from 'react-i18next';
import ErrorMessage from './components/ErrorMessage';

function Gantt() {
  const isSettingsModalOpen = location.pathname === '/settings';
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.wbsData.data);
  const pastLength = useSelector((state: RootState) => state.wbsData.past.length);
  const futureLength = useSelector((state: RootState) => state.wbsData.future.length);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const maxWbsWidth = useSelector((state: RootState) => state.baseSettings.maxWbsWidth);
  const dateRange = useSelector((state: RootState) => state.baseSettings.dateRange);
  const columns = useSelector((state: RootState) => state.wbsData.columns);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const rowHeight = useSelector((state: RootState) => state.baseSettings.rowHeight);
  const isContextMenuOpen = useSelector((state: RootState) => state.uiFlags.isContextMenuOpen);
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
  const dateArray = useMemo(() => generateDates(dateRange.startDate, dateRange.endDate), [dateRange]);
  const renderRowsInterval = 30;
  const visibleRows = useMemo(() => Math.ceil(gridHeight / rowHeight), [gridHeight, rowHeight]);
  const totalRows = useMemo(() => Object.keys(data).length, [data]);
  const filteredData = useMemo(() => {
    const result: [string, WBSData][] = [];
    let skip = false;
    Object.entries(data).forEach(([key, entry]) => {
      if (isSeparatorRow(entry)) {
        skip = entry.isCollapsed;
        result.push([key, entry]);
      } else if (!skip) {
        result.push([key, entry]);
      }
    });
    return result;
  }, [data]);

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

  const updateVisibleRange = useCallback(() => {
    if (!gridRef.current) return;
    const startIndex = Math.max(Math.floor(gridRef.current.scrollTop / rowHeight) - renderRowsInterval, 0);
    const endIndex = Math.min(totalRows - 1, startIndex + visibleRows + (renderRowsInterval * 2));
    if (Math.abs(startIndex - visibleRange.startIndex) >= renderRowsInterval || (startIndex == 0 && visibleRange.startIndex != 0)) {
      setVisibleRange({ startIndex, endIndex });
    }
  }, [rowHeight, visibleRows, totalRows, visibleRange.startIndex]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!gridRef.current) return;

    if (canGridRefDrag && isMouseDown) {
      const newScrollLeft = startX - event.clientX;
      const newScrollTop = startY - event.clientY;
      gridRef.current.scrollLeft = newScrollLeft;
      gridRef.current.scrollTop = newScrollTop;
      const gridStartX = (gridRef.current.scrollLeft - wbsWidth) % cellWidth;
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      let adjustedY = indicatorPosition.y
      if (canGridRefDrag) {
        const gridStartY = gridRef.current.scrollTop % rowHeight;
        adjustedY = Math.floor((event.clientY + gridStartY + 1) / rowHeight) * rowHeight - gridStartY;
      }
      if (prevIndicatorRef.current.x !== adjustedX || prevIndicatorRef.current.y !== adjustedY) {
        setIndicatorPosition({ x: adjustedX, y: adjustedY });
        prevIndicatorRef.current = { x: adjustedX, y: adjustedY };
      }
    } else if (!isGridRefDragging) {
      const gridStartX = (gridRef.current.scrollLeft - wbsWidth) % cellWidth;
      const adjustedX = Math.floor((event.clientX + gridStartX - 1) / cellWidth) * cellWidth - gridStartX + 1;
      let adjustedY = indicatorPosition.y;
      if (!isContextMenuOpen && canGridRefDrag) {
        const gridStartY = gridRef.current.scrollTop % rowHeight;
        adjustedY = Math.floor((event.clientY + gridStartY + 1) / rowHeight) * rowHeight - gridStartY;
      }
      if (prevIndicatorRef.current.x !== adjustedX || prevIndicatorRef.current.y !== adjustedY) {
        setIndicatorPosition({ x: adjustedX, y: adjustedY });
        prevIndicatorRef.current = { x: adjustedX, y: adjustedY };
      }
    } else if (isGridRefDragging && !isMouseDown) {
      setIsGridRefDragging(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGridRefDrag, cellWidth, isGridRefDragging, isMouseDown, startX, startY, wbsWidth, isContextMenuOpen]);

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
    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
      if (isMouseDown) {
        resetDragTimeout();
      }
      updateVisibleRange();
    }
  }, [isGridRefDragging, isMouseDown, resetDragTimeout, updateVisibleRange]);

  const handleHorizontalScroll = useCallback((sourceRef: React.RefObject<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement>) => {
    if (!isGridRefDragging) {
      setIsGridRefDragging(true);
    }
    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
      if (isMouseDown) {
        resetDragTimeout();
      }
    }
  }, [isGridRefDragging, isMouseDown, resetDragTimeout]);

  useEffect(() => {
    const isChromiumBased = /Chrome/.test(navigator.userAgent) || /Chromium/.test(navigator.userAgent);
    if (!isChromiumBased) {
      alert(t('Browser Compatibility Alert'));
    }
    const translatedColumns = columns.map(column => ({
      ...column,
      columnName: t(column.columnName ?? ""),
    }));
    dispatch(setColumns(translatedColumns));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cellWidth !== prevCellWidthRef.current && gridRef.current) {
      const mouseX = prevIndicatorRef.current.x;
      const relativeMouseX = mouseX - gridRef.current.getBoundingClientRect().left + gridRef.current.scrollLeft;
      const scale = cellWidth / prevCellWidthRef.current;
      const newScrollLeft = (relativeMouseX * scale) - (mouseX - gridRef.current.getBoundingClientRect().left);
      gridRef.current.scrollLeft = newScrollLeft;
      prevCellWidthRef.current = cellWidth;
      if (!isGridRefDragging) {
        setIsGridRefDragging(true);
      }
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
    const wbsHandleWheel = (event: WheelEvent) => {
      if (wbsRef.current) {
        if (event.shiftKey) {
          const newScrollLeft = wbsRef.current.scrollLeft + event.deltaY;
          wbsRef.current.scrollLeft = newScrollLeft;
          event.preventDefault();
        } else if (event.ctrlKey) {
          /* empty */
        } else {
          const newScrollTop = wbsRef.current.scrollTop + event.deltaY;
          const newScrollLeft = wbsRef.current.scrollLeft + event.deltaX;
          wbsRef.current.scrollTop = newScrollTop;
          wbsRef.current.scrollLeft = newScrollLeft;
          event.preventDefault();
        }
      }
    };
    const gridHandleWheel = (event: WheelEvent) => {
      if (gridRef.current) {
        if (event.shiftKey) {
          const newScrollLeft = gridRef.current.scrollLeft + event.deltaY;
          gridRef.current.scrollLeft = newScrollLeft;
          event.preventDefault();
        } else if (event.ctrlKey) {
          /* empty */
        } else {
          const newScrollTop = gridRef.current.scrollTop + event.deltaY;
          const newScrollLeft = gridRef.current.scrollLeft + event.deltaX;
          gridRef.current.scrollTop = newScrollTop;
          gridRef.current.scrollLeft = newScrollLeft;
          event.preventDefault();
        }
      }
    };
    if (wbsElement && gridElement) {
      wbsElement.addEventListener('wheel', wbsHandleWheel, { passive: false });
      gridElement.addEventListener('wheel', gridHandleWheel, { passive: false });
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
        wbsElement.removeEventListener('wheel', wbsHandleWheel);
        gridElement.removeEventListener('wheel', gridHandleWheel);
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
      const rowCount = filteredData.length;
      const maxGridHeight = window.innerHeight - (rowHeight * 2);
      const dynamicGridHeight = rowCount * rowHeight;
      return dynamicGridHeight < maxGridHeight ? dynamicGridHeight : maxGridHeight;
    };
    const updateGridHeight = () => {
      setGridHeight(calculateGridHeight());
    };
    window.addEventListener('resize', updateGridHeight);
    updateGridHeight();
    return () => window.removeEventListener('resize', updateGridHeight);
  }, [filteredData, rowHeight]);

  useEffect(() => {
    updateVisibleRange();
  }, [gridHeight, updateVisibleRange]);

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

  return (
    <div style={{ position: 'fixed' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '0px', width: `${wbsWidth}px`, overflow: 'hidden' }}>
          <SettingButton />
          <TitleSetting />
        </div>
        <div style={{ position: 'absolute', left: `${wbsWidth}px`, width: `calc(100vw - ${wbsWidth}px)`, height: '100vh', overflow: 'hidden', borderLeft: '1px solid #00000066', scrollBehavior: 'auto' }} ref={calendarRef}>
          <Calendar dateArray={dateArray} />
          <GridVertical dateArray={dateArray} gridHeight={gridHeight} />
        </div>
        <div style={{ position: 'absolute', top: `${rowHeight}px`, width: `${wbsWidth}px`, height: `calc(100vh - ${rowHeight}px)`, overflowX: 'scroll', overflowY: 'hidden', scrollBehavior: 'auto' }} ref={wbsRef}>
          {filteredData.map(([key, entry], filteredIndex) => {
            if (gridRef.current && isSeparatorRow(entry) && filteredIndex >= visibleRange.startIndex && filteredIndex <= visibleRange.endIndex) {
              const topPosition = (filteredIndex * rowHeight) + rowHeight;
              return (
                <SeparatorRowLabelComponent
                  key={key}
                  entry={entry}
                  topPosition={topPosition}
                />
              );
            } else {
              return null;
            }
          })}
          <WBSInfo />
        </div>

        <ResizeBar />

        <div style={{ position: 'absolute', top: `${rowHeight * 2}px`, left: `${wbsWidth}px`, width: `calc(100vw - ${wbsWidth}px)`, height: `calc(100vh - ${rowHeight * 2}px)`, overflow: 'scroll', borderLeft: '1px solid transparent', scrollBehavior: 'auto' }} ref={gridRef}>
          <div style={{ height: `${(filteredData.length * rowHeight)}px`, width: `${(dateArray.length * cellWidth)}px` }}>
            {filteredData.map(([key, entry], filteredIndex) => {
              if (gridRef.current) {
                if (filteredIndex >= visibleRange.startIndex && filteredIndex <= visibleRange.endIndex) {
                  const topPosition = filteredIndex * rowHeight;
                  if (isChartRow(entry)) {
                    return (
                      <ChartRowComponent
                        key={key}
                        entry={entry}
                        dateArray={dateArray}
                        gridRef={gridRef}
                        setCanGridRefDrag={setCanGridRefDrag}
                        topPosition={topPosition}
                      />
                    );
                  } else if (isSeparatorRow(entry)) {
                    return (
                      <SeparatorRowComponent
                        key={key}
                        entry={entry}
                        topPosition={topPosition}
                        dateArray={dateArray}
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
                        topPosition={topPosition}
                      />
                    );
                  }
                }
                return null;
              }
            })}
          </div>
        </div>
        <div style={{ position: 'fixed', bottom: '0px', right: '50px', fontSize: '0.6rem', pointerEvents: 'none' }}>
          <div>Undo: {pastLength - 1}, Redo: {futureLength}</div>
        </div>
      </div>

      {!isSettingsModalOpen && !isGridRefDragging && (
        <>
          {!isSettingsModalOpen && !isGridRefDragging && (
            <>
              {(indicatorPosition.y > 41 && window.innerHeight - indicatorPosition.y > 36) && (
                <div
                  className="horizontal-indicator"
                  style={{
                    width: '100vw',
                    height: '0.6px',
                    backgroundColor: 'rgba(59, 42, 255, 0.609)',
                    position: 'absolute',
                    left: 0,
                    top: `${indicatorPosition.y + rowHeight - 1}px`,
                    pointerEvents: 'none',
                    zIndex: '20'
                  }}
                ></div>
              )}
              {!isContextMenuOpen && (indicatorPosition.x > wbsWidth) && (cellWidth > 5) && (
                <div
                  className="vertical-indicator"
                  style={{
                    height: `${gridHeight + rowHeight}px`,
                    width: `${cellWidth + 1}px`,
                    backgroundColor: 'rgba(124, 124, 124, 0.09)',
                    position: 'absolute',
                    left: indicatorPosition.x + 'px',
                    top: `${rowHeight}px`,
                    pointerEvents: 'none',
                    zIndex: '20'
                  }}
                ></div>
              )}
            </>
          )}
        </>
      )}
      <ErrorMessage />
    </div>
  );
}

export default Gantt