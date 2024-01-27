// ChartBar.tsx
import React from 'react';
import { ChartCell } from './ChartCell';

interface ChartBarProps {
  startDate: Date | null;
  endDate: Date | null;
  dateArray: Date[];
  isActual: boolean;
  entryId: string;
  eventIndex?: number;
  chartBarColor: string;
  onBarMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void; 
  onBarEndMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void; 
  onBarStartMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void; 
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void; 
}

const getStartOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const MemoedChartBar: React.FC<ChartBarProps> = ({ startDate, endDate, dateArray, isActual, entryId, eventIndex, chartBarColor, onBarMouseDown, onBarEndMouseDown, onBarStartMouseDown, onContextMenu }) => {
  if (!startDate || !endDate) {
    return null;
  }

  const startOfDay = getStartOfDay(startDate);
  const endOfDay = getStartOfDay(endDate);
  const dateArrayStart = dateArray[0];
  const dateArrayEnd = dateArray[dateArray.length - 1];

  if (startDate > dateArrayEnd || endDate < dateArrayStart) {
    return null;
  }

  let startIndex = dateArray.findIndex(date => date >= startOfDay);
  let endIndex = dateArray.findIndex(date => date > endOfDay);
  startIndex = startIndex === -1 ? 0 : startIndex;
  endIndex = endIndex === -1 ? dateArray.length - 1 : endIndex - 1;
  
  if (endIndex < startIndex) {
    return null;
  }

  if (startIndex !== -1 && endIndex !== -1) {
    const width = ((endIndex - startIndex + 1) * 21) + 0.1;
    const leftPosition = startIndex * 21;

    return (
      <>
        <div
          style={{position: 'absolute', left: `${leftPosition - 8}px`, width: '8px', height: '21px', cursor: 'ew-resize', opacity: 0 }}
          {...{ onMouseDown: onBarStartMouseDown }}
        ></div>
        <div
          style={{position: 'absolute', left: `${leftPosition}px`, width: `${width}px`}}
          {...{ onMouseDown: onBarMouseDown, onContextMenu: onContextMenu }}
        >
          <ChartCell
            entryId={entryId}
            eventIndex={eventIndex}
            isActual={isActual}
            isPlanned={!isActual}
            chartBarColor={chartBarColor}
            width={width}
          />
        </div>
        <div
          style={{position: 'absolute', left: `${leftPosition + width}px`, width: '8px', height: '21px', cursor: 'ew-resize', opacity: 0 }}
          {...{ onMouseDown: onBarEndMouseDown }}
        ></div>
      </>
    );
  }

  return null;
};

export const ChartBar = React.memo(MemoedChartBar);