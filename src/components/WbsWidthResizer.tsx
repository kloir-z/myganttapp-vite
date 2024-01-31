import React, { useRef, useCallback } from 'react';

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

  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    initialPositionRef.current = null;
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    initialPositionRef.current = event.clientX;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    event.preventDefault();
  };

  return (
    <div 
      style={{ 
        width: '5px', 
        cursor: 'ew-resize', 
        position: 'absolute', 
        left: `${initialWidth}px`, 
        height: '100vh', 
        zIndex: 10 
      }} 
      onMouseDown={handleMouseDown} 
    />
  );
}

export const ResizeBar = React.memo(MemoedResizeBar);