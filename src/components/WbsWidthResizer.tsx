import React, { useRef } from 'react';

interface ResizeBarProps {
  onDrag: (newWidth: number) => void;
  initialWidth: number;
}

function MemoedResizeBar({ onDrag, initialWidth }: ResizeBarProps) {
  const initialPositionRef = useRef<number | null>(null);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    initialPositionRef.current = event.clientX;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    event.preventDefault();
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (initialPositionRef.current !== null) {
      const deltaX = event.clientX - initialPositionRef.current;
      const newWidth = initialWidth + deltaX;
      onDrag(newWidth);
    }
    event.preventDefault();
  };

  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    initialPositionRef.current = null;
  };

  return (
    <div 
      style={{ 
        width: '5px', 
        cursor: 'ew-resize', 
        position: 'absolute', 
        left: `${initialWidth}px`, 
        height: '100vh', 
        zIndex: 9999 
      }} 
      onMouseDown={handleMouseDown} 
    />
  );
}

export const ResizeBar = React.memo(MemoedResizeBar);