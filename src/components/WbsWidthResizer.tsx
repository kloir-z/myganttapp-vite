import React, { useRef, useCallback } from 'react';
import styled from 'styled-components';

interface StyledResizeBarProps {
  width: number;
}

const StyledResizeBar = styled.div<StyledResizeBarProps>`
  width: 5px;
  cursor: ew-resize;
  position: absolute;
  left: ${props => props.width}px;
  height: 100vh;
  z-index: 10;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #2773ff90;
  }
`;

interface ResizeBarProps {
  onDrag: (newWidth: number) => void;
  initialWidth: number;
}

function MemoedResizeBar({ onDrag, initialWidth }: ResizeBarProps) {
  const initialPositionRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (initialPositionRef.current !== null) {
      const deltaX = event.clientX - initialPositionRef.current;
      const newWidth = initialWidth + deltaX;
      onDrag(newWidth);
    }
    event.preventDefault();
  }, [initialWidth, onDrag]);

  const handleMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    initialPositionRef.current = null;
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    initialPositionRef.current = event.clientX;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    event.preventDefault();
  }, [handleMouseMove, handleMouseUp]);

  return (
    <StyledResizeBar
      width={initialWidth}
      onMouseDown={handleMouseDown}
    />
  );
}

export const ResizeBar = React.memo(MemoedResizeBar);