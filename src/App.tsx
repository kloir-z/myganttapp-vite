// App.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import Calendar from './components/Chart/Calendar';
import { ChartRow, EventRow  } from './types/DataTypes';
import { GanttRow } from './styles/GanttStyles';
import WBSInfo from './components/Table/WBSInfo';
import ChartRowComponent from './components/Chart/ChartRowComponent';
import EventRowComponent from './components/Chart/EventRowComponent';
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
import { handleImport } from './components/Setting/utils/settingHelpers';

function App() {  
  const dispatch = useDispatch();
  const data = useSelector(
    (state: RootState) => state.wbsData.present.data,
    (prevData, nextData) => isEqual(prevData, nextData)
  );
  const selectUndoRedo = (state: RootState) => ({
    undoCount: state.wbsData.past.length,
    redoCount: state.wbsData.future.length,
  });
  const { undoCount, redoCount } = useSelector(selectUndoRedo);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const maxWbsWidth = useSelector((state: RootState) => state.baseSettings.maxWbsWidth);
  const dateRange = useSelector((state: RootState) => state.baseSettings.dateRange);  
  const columns = useSelector((state: RootState) => state.baseSettings.columns);  
  const { headerRow, visibleColumns } = useWBSData();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [dateArray, setDateArray] = useState(generateDates(dateRange.startDate, dateRange.endDate));
  const [isDragging, setIsDragging] = useState(false);
  const [canDrag, setCanDrag] = useState(true);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const wbsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const calendarWidth = dateArray.length * 21;

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
    const initConfigPath = '/testdata/testfile.json';
    fetch(initConfigPath)
      .then(response => response.json())
      .then(data => {
        const file = new Blob([JSON.stringify(data)], { type: 'application/json' });
        handleImport(new File([file], "file.json"), dispatch);
      })
      .catch(error => console.error("Failed to load initialization file:", error));
  }, [dispatch]);
  
  useEffect(() => {
    setDateArray(generateDates(dateRange.startDate, dateRange.endDate));
  }, [dateRange]);

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
    const maxGridHeight = `calc(100vh - 41px)`;
    const dynamicGridHeight = `${rowCount * 21}px`;
    return rowCount * 21 < window.innerHeight - 41 ? dynamicGridHeight : maxGridHeight;
  };

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (canDrag && gridRef.current) {
      setIsDragging(true);
      setStartX(event.clientX + gridRef.current.scrollLeft);
      setStartY(event.clientY + gridRef.current.scrollTop);
    }
  }, [canDrag]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (canDrag && isDragging && gridRef.current) {
      gridRef.current.scrollLeft = startX - event.clientX;
      gridRef.current.scrollTop = startY - event.clientY;
    }
  }, [canDrag, isDragging, startX, startY]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !isSettingsModalOpen) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            dispatch(ActionCreators.undo());
            break;
          case 'y':
            event.preventDefault();
            dispatch(ActionCreators.redo());
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
    <div style={{position: 'fixed'}}>
      <div style={{position: 'relative'}}>
        <div style={{position: 'absolute', left: '0px', width: `${wbsWidth}px`, overflow: 'hidden'}} ref={calendarRef}>
          <SettingButton onClick={openSettingsModal} />
          <SettingsModal
            show={isSettingsModalOpen}
            onClose={closeSettingsModal}
          />
          <TitleSetting />
        </div>
        <div style={{position: 'absolute', left: `${wbsWidth}px`, width: `calc(100vw - ${wbsWidth}px)`, height: '100vh', overflow: 'hidden'}} ref={calendarRef}>
          <Calendar
            dateArray={dateArray}
          />
          <GridVertical dateArray={dateArray} gridHeight={calculateGridHeight()} />
        </div>
        <div className="hiddenScrollbar" style={{position: 'absolute', top: '21px', width: `${wbsWidth}px`, height: `calc(100vh - 33px)`, overflowX: 'scroll'}} ref={wbsRef}>
          <WBSInfo
            headerRow={headerRow}
            visibleColumns={visibleColumns}
          />
        </div>
        <ResizeBar onDrag={handleResize} initialWidth={wbsWidth} />
        <div style={{position: 'absolute', top: '42px', left: `${wbsWidth}px`, width: `calc(100vw - ${wbsWidth}px)`, height: `calc(100vh - 41px)`, overflow: 'scroll'}} ref={gridRef}>
          {Object.entries(data).map(([id, entry], index) => {
            const topPosition = index * 21;
            if (entry.rowType === 'Chart') {
              return (
                <GanttRow
                  key={id}
                  style={{
                    position: 'absolute',
                    top: `${topPosition}px`,
                    width: `${calendarWidth}px`
                  }}
                >
                  <ChartRowComponent
                    entry={entry as ChartRow}
                    dateArray={dateArray}
                    gridRef={gridRef}
                    setCanDrag={setCanDrag}
                  />
                </GanttRow>
              );
            } else if (entry.rowType === 'Separator') {
              return (
                <div
                  key={id}
                  style={{
                    backgroundColor: '#ddedff',
                    position: 'absolute',
                    top: `${topPosition}px`,
                  }}
                >
                  <GanttRow key={id} style={{ backgroundColor: '#ddedff', borderBottom: 'solid 1px #e8e8e8', width: `${calendarWidth}px`}}/>
                </div>
              );
            } else if (entry.rowType === 'Event') {
              return (
                <GanttRow
                  key={id}
                  style={{
                    position: 'absolute',
                    top: `${topPosition}px`,
                    width: `${calendarWidth}px`
                  }}
                >
                <EventRowComponent
                  entry={entry as EventRow}
                  dateArray={dateArray}
                  gridRef={gridRef}
                  setCanDrag={setCanDrag}
                />
                </GanttRow>
              );
            }
            return null;
          })}
        </div>
        <div style={{ position: 'fixed', bottom: '0px', left: '3px', fontSize: '0.6rem' }}>
          <div>Undo: {undoCount}, Redo: {redoCount}</div>
        </div>
      </div>
    </div>
  );
}

export default App;