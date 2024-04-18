// ChartBar.tsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { StyledBar } from '../../styles/GanttStyles';
import AutoWidthInputBox from '../AutoWidthInputBox';
import { cdate } from 'cdate';
import 'tippy.js/dist/tippy.css';

interface ChartBarProps {
  startDate: string | null;
  endDate: string | null;
  dateArray: ReturnType<typeof cdate>[];
  isActual: boolean;
  entryId: string;
  eventIndex?: number;
  chartBarColor: string;
  isBarDragged?: boolean;
  onBarMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBarEndMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBarStartMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const MemoedChartBar: React.FC<ChartBarProps> = ({ startDate, endDate, dateArray, isActual, entryId, eventIndex, chartBarColor, isBarDragged, onBarMouseDown, onBarEndMouseDown, onBarStartMouseDown, onContextMenu }) => {
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const rowHeight = useSelector((state: RootState) => state.baseSettings.rowHeight);
  const startCDate = useMemo(() => startDate ? cdate(startDate) : null, [startDate]);
  const endCDate = useMemo(() => endDate ? cdate(endDate) : null, [endDate]);

  const [startIndex, endIndex] = useMemo(() => {
    if (!startCDate || !endCDate) return [-1, -1];
    const arrayStart = dateArray[0];
    const arrayEnd = dateArray[dateArray.length - 1];
    if (+startCDate > +arrayEnd || +endCDate < +arrayStart) {
      return [-1, -1];
    }
    let startIdx = dateArray.findIndex(date => date >= startCDate);
    let endIdx = dateArray.findIndex(date => date > endCDate);
    startIdx = startIdx === -1 ? 0 : startIdx;
    endIdx = endIdx === -1 ? dateArray.length - 1 : endIdx - 1;
    return [startIdx, endIdx];
  }, [startCDate, endCDate, dateArray]);

  const { width, leftPosition } = useMemo(() => {
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      return { width: 0, leftPosition: 0 };
    }
    const widthCalc = ((endIndex - startIndex + 1) * cellWidth) + 0.1;
    const leftCalc = startIndex * cellWidth;
    return { width: widthCalc, leftPosition: leftCalc };
  }, [startIndex, endIndex, cellWidth]);

  if (endIndex < startIndex) {
    return null;
  }

  return (
    <>
      <div
        style={{ position: 'absolute', left: `${leftPosition - 6}px`, width: '5px', height: `${rowHeight}px`, cursor: 'ew-resize', opacity: 0 }}
        {...{ onMouseDown: onBarStartMouseDown }}
      ></div>
      <StyledBar
        $chartBarColor={chartBarColor}
        $width={width}
        $height={rowHeight}
        $left={leftPosition}
        {...{ onMouseDown: onBarMouseDown, onContextMenu: onContextMenu }}
      >
        {(!isActual && entryId) && (
          <AutoWidthInputBox
            entryId={entryId}
            eventIndex={eventIndex}
            isBarDragged={isBarDragged}
          />
        )}
      </StyledBar>
      <div
        style={{ position: 'absolute', left: `${leftPosition + width + 1.5}px`, width: '5px', height: `${rowHeight}px`, cursor: 'ew-resize', opacity: 0 }}
        {...{ onMouseDown: onBarEndMouseDown }}
      ></div>
    </>
  );
};

export const ChartBar = React.memo(MemoedChartBar);