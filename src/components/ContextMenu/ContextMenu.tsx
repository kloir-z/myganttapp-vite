// ContextMenu.tsx
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { MenuItemProps, MenuItem } from './ContextMenuItem'; // MenuItemのインポートを確認
import styled from 'styled-components';

const StyledMenu = styled.div`
  position: fixed;
  z-index: 1000;
  border: 1px solid #e6e6e6;
  background-color: #FFF;
  min-width: 100px;
  box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
`;
interface ContextMenuProps {
  items?: MenuItemProps[];
  targetRef: React.RefObject<HTMLElement>;
}

const ContextMenu: React.FC<ContextMenuProps> = memo(({ items, targetRef }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
    setIsVisible(true);
    setMenuPosition({
      x: event.pageX,
      y: event.pageY,
    });
  }, []);

  const closeMenu = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const targetElement = targetRef.current;
    if (targetElement) {
      targetElement.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('mousedown', (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          closeMenu();
        }
      });

      return () => {
        targetElement.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('mousedown', closeMenu);
      };
    }
  }, [closeMenu, handleContextMenu, targetRef]);

  return isVisible ? (
    <StyledMenu
      ref={menuRef}
      style={{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
    >
      {items?.map((item, index) => (
        <MenuItem
          key={index}
          closeMenu={closeMenu}
          {...item}
        />
      ))}
    </StyledMenu>
  ) : null;
});

export default ContextMenu;