// ChartBar.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { Cell } from '../../styles/GanttStyles';
import AutoWidthInputBox from '../AutoWidthInputBox';
import { cdate } from 'cdate';

interface ChartBarProps {
  startDate: string | null;
  endDate: string | null;
  dateArray: ReturnType<typeof cdate>[];
  isActual: boolean;
  entryId: string;
  eventIndex?: number;
  chartBarColor: string;
  isPlannedBarDragging?: boolean;
  onBarMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBarEndMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBarStartMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const MemoedChartBar: React.FC<ChartBarProps> = ({ startDate, endDate, dateArray, isActual, entryId, eventIndex, chartBarColor, isPlannedBarDragging, onBarMouseDown, onBarEndMouseDown, onBarStartMouseDown, onContextMenu }) => {
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  if (!startDate || !endDate) {
    return null;
  }

  const startCDate = cdate(startDate);
  const endCDate = cdate(endDate);
  const dateArrayStart = dateArray[0];
  const dateArrayEnd = dateArray[dateArray.length - 1];

  if (+startCDate > +dateArrayEnd || +endCDate < +dateArrayStart) {
    return null;
  }

  let startIndex = dateArray.findIndex(date => date >= startCDate);
  let endIndex = dateArray.findIndex(date => date > endCDate);
  startIndex = startIndex === -1 ? 0 : startIndex;
  endIndex = endIndex === -1 ? dateArray.length - 1 : endIndex - 1;

  if (endIndex < startIndex) {
    return null;
  }

  if (startIndex !== -1 && endIndex !== -1) {
    const width = ((endIndex - startIndex + 1) * cellWidth) + 0.1;
    const leftPosition = startIndex * cellWidth;

    return (
      <>
        <div
          style={{ position: 'absolute', left: `${leftPosition - 6}px`, width: '5px', height: '21px', cursor: 'ew-resize', opacity: 0 }}
          {...{ onMouseDown: onBarStartMouseDown }}
        ></div>
        <Cell
          $chartBarColor={chartBarColor}
          $width={width}
          $left={leftPosition}
          {...{ onMouseDown: onBarMouseDown, onContextMenu: onContextMenu }}
        >
          {(!isActual && entryId) && (
            <AutoWidthInputBox
              entryId={entryId}
              eventIndex={eventIndex}
              isPlannedBarDragging={isPlannedBarDragging}
            />
          )}
        </Cell>
        <div
          style={{ position: 'absolute', left: `${leftPosition + width + 1.5}px`, width: '5px', height: '21px', cursor: 'ew-resize', opacity: 0 }}
          {...{ onMouseDown: onBarEndMouseDown }}
        ></div>
      </>
    );
  }
  return null;
};

export const ChartBar = React.memo(MemoedChartBar);