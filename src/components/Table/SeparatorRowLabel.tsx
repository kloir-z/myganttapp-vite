import React, { memo } from 'react';
import { SeparatorRow } from '../../types/DataTypes';
import { useDispatch } from 'react-redux';
import { toggleSeparatorCollapsed } from '../../reduxStoreAndSlices/store';
import { MdExpandMore, MdChevronRight } from 'react-icons/md';

interface SeparatorRowLabelProps {
  entry: SeparatorRow;
  topPosition: number;
}

const SeparatorRowLabelComponent: React.FC<SeparatorRowLabelProps> = memo(({ entry, topPosition }) => {
  const dispatch = useDispatch();
  const adjustedTopPosition = topPosition + 22;
  const isCollapsed: boolean = entry.isCollapsed;

  return (
    <>
      <div
        style={{ 
          position: 'absolute', 
          top: `${adjustedTopPosition + 1}px`, 
          left: '40px', 
          cursor: 'pointer',
          zIndex: '1',
          fontSize: '1rem'
        }}
        onClick={() => dispatch(toggleSeparatorCollapsed({ id: entry.id }))}
      >
        {isCollapsed ? <MdChevronRight /> : <MdExpandMore />}
      </div>
      <span 
        style={{ 
          position: 'absolute', 
          top: `${adjustedTopPosition}px`, 
          left: '53px', 
          padding: '0px 6px', 
          zIndex: '1', 
          pointerEvents: 'none', 
          whiteSpace: 'nowrap' 
        }}
      >
        {entry.displayName}
      </span>
    </>
  );
});

export default SeparatorRowLabelComponent;