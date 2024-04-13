import React, { memo, useMemo, useRef } from 'react';
import { SeparatorRow } from '../../types/DataTypes';
import { GanttRow } from '../../styles/GanttStyles';
import { addRow, deleteRows, insertCopiedRow, RootState } from '../../reduxStoreAndSlices/store';
import { useDispatch, useSelector } from 'react-redux';
import { cdate } from 'cdate';
import { setCopiedRows } from '../../reduxStoreAndSlices/copiedRowsSlice';
import ContextMenu from '../ContextMenu/ContextMenu';
import { setIsSettingsModalOpen } from '../../reduxStoreAndSlices/uiFlagSlice';

interface SeparatorRowProps {
  entry: SeparatorRow;
  topPosition: number;
  dateArray: ReturnType<typeof cdate>[];
}

const SeparatorRowComponent: React.FC<SeparatorRowProps> = memo(({ entry, topPosition, dateArray }) => {
  const dispatch = useDispatch();
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const copiedRows = useSelector((state: RootState) => state.copiedRows.rows);
  const ganttRowRef = useRef<HTMLDivElement>(null);

  const { lineStart, lineWidth } = useMemo(() => {
    if (!entry.minStartDate || !entry.maxEndDate) {
      return { lineStart: 0, lineWidth: 0 };
    }
    const startDate = cdate(entry.minStartDate);
    const endDate = cdate(entry.maxEndDate);
    let startCDate = dateArray.findIndex(date => date >= startDate);
    let endCDate = dateArray.findIndex(date => date > endDate);
    if (startCDate === -1) {
      startCDate = dateArray.length - 1;
    } else if (startCDate < 0) {
      startCDate = 0;
    }
    if (endCDate === -1) {
      endCDate = dateArray.length;
    } else if (endCDate < 0) {
      endCDate = 0;
    }
    const lineStart = startCDate * cellWidth;
    const lineWidth = (endCDate - startCDate) * cellWidth;
    return { lineStart, lineWidth };
  }, [entry.minStartDate, entry.maxEndDate, dateArray, cellWidth]);

  const menuOptions = useMemo(() => {
    const addChartRowItems = [];
    for (let i = 1; i <= 10; i++) {
      addChartRowItems.push({
        children: `${i}`,
        onClick: () => {
          const insertAtId = entry.id;
          dispatch(addRow({ rowType: "Chart", insertAtId: insertAtId, numberOfRows: i }));
        },
      });
    }
    const addEventRowItems = [];
    for (let i = 1; i <= 10; i++) {
      addEventRowItems.push({
        children: `${i}`,
        onClick: () => {
          const insertAtId = entry.id;
          dispatch(addRow({ rowType: "Event", insertAtId: insertAtId, numberOfRows: i }));
        },
      });
    }
    const insertCopiedRowDisabled = copiedRows.length === 0;
    const options = [
      {
        children: "Copy Row",
        onClick: () => dispatch(setCopiedRows([entry])),
      },
      {
        children: "Cut Row",
        onClick: () => {
          dispatch(deleteRows([entry.id]));
          dispatch(setCopiedRows([entry]));
        },
      },
      {
        children: "Insert Copied Row",
        onClick: () => {
          const insertAtId = entry.id;
          dispatch(insertCopiedRow({ insertAtId: insertAtId, copiedRows }))
        },
        disabled: insertCopiedRowDisabled
      },
      {
        children: "Add Row",
        items: [
          {
            children: "Separator",
            onClick: () => {
              const insertAtId = entry.id;
              dispatch(addRow({ rowType: "Separator", insertAtId: insertAtId, numberOfRows: 1 }));
            },
          },
          {
            children: "Chart",
            onClick: () => {
              const insertAtId = entry.id;
              dispatch(addRow({ rowType: "Chart", insertAtId: insertAtId, numberOfRows: 1 }));
            },
            items: addChartRowItems,
            path: '1.0'
          },
          {
            children: "Event",
            onClick: () => {
              const insertAtId = entry.id;
              dispatch(addRow({ rowType: "Event", insertAtId: insertAtId, numberOfRows: 1 }));
            },
            items: addEventRowItems,
            path: '1.1'
          }
        ],
        path: '1'
      },
      {
        children: "Setting",
        onClick: () => {
          dispatch(setIsSettingsModalOpen(true))
        },
      }
    ];
    return options;
  }, [copiedRows, dispatch, entry]);

  return (
    <>
      <GanttRow style={{ position: 'absolute', top: `${topPosition}px`, width: `${calendarWidth}px`, backgroundColor: '#ddedff', alignItems: 'center' }} ref={ganttRowRef}>
        {entry.isCollapsed &&
          <div style={{ position: 'absolute', top: '0px', left: `${lineStart}px`, width: `${lineWidth}px`, height: '21px', backgroundColor: '#bfbfbf5d' }}></div>
        }
        <span style={{ position: 'sticky', left: `0px`, color: '#000000ec', padding: '0px 6px', whiteSpace: 'nowrap' }}>{entry.displayName}</span>
      </GanttRow>
      <ContextMenu
        targetRef={ganttRowRef}
        items={menuOptions}
      />
    </>
  );
});

export default SeparatorRowComponent;
