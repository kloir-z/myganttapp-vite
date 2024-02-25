// ChartBarContextMenu.tsx
import React, { useEffect, useRef, memo } from 'react';

interface ChartBarContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
}

const ChartBarContextMenu: React.FC<ChartBarContextMenuProps> = memo(({ x, y, onClose, onDelete }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={menuRef} style={{ position: 'fixed', top: y, left: x, zIndex: 1000, backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
      <div onClick={onDelete} style={{ padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
        Delete
      </div>
    </div>
  );
});

export default ChartBarContextMenu;