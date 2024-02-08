// ChartCell.tsx
import React from 'react';
import { Cell } from '../../styles/GanttStyles';
import AutoWidthInputBox from '../AutoWidthInputBox';

interface MemoedChartCellProps {
  entryId?: string;
  eventIndex?: number;
  type?: string;
  isPlanned?: boolean;
  isActual?: boolean;
  chartBarColor?: string;
  width?: number;
}

const MemoedChartCell: React.FC<MemoedChartCellProps> = ({
  entryId,
  eventIndex,
  type,
  isPlanned,
  isActual,
  chartBarColor,
  width
}) => {
  return (
    <Cell
      $type={type}
      $isPlanned={isPlanned}
      $isActual={isActual}
      $chartBarColor={chartBarColor}
      $width={width}
      style={{ position: 'relative' }}
    >
      {(isPlanned && entryId) && (
        <AutoWidthInputBox
          entryId={entryId}
          eventIndex={eventIndex}
        />
      )}
    </Cell>
  );
};

export const ChartCell = React.memo(MemoedChartCell);