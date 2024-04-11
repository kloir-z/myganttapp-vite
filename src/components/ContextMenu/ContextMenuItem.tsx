// ContextMenuItem.tsx
import React, { memo, useCallback } from 'react';
import { css, styled } from 'styled-components';
import { MdCheckBox, MdCheckBoxOutlineBlank, MdChevronRight } from 'react-icons/md';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { setOpenSubMenu } from '../../reduxStoreAndSlices/contextMenuSlice';

const StyledMenuItem = styled.div`
  position: relative;
  cursor: pointer;
`;

const MenuItemContent = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  padding: 4px 15px;
  background-color: #FFF;
  min-width: 100px;
  white-space: nowrap;

  &:hover {
    background-color: #efefef;
  }

  ${({ disabled }) =>
    disabled &&
    css`
      color: #d1d1d1;
    `}
`;

const CheckboxIcon = styled.span`
  display: flex;
  align-items: center;
  margin-right: 5px;
`;

const SubMenuIndicator = styled.span`
  display: flex;
  align-items: center;
  margin-left: auto;
  padding-left: 15px;
`;

const SubMenu = styled.div`
  position: absolute;
  top: 0;
  left: 100%;
  border: 1px solid #ececec;
  background-color: #FFF;
  min-width: 50px;
  box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
`;

export interface MenuItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  items?: MenuItemProps[];
  path?: string;
  closeMenu?: () => void;
  disabled?: boolean;
  checked?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = memo(({ onClick, children, items, path, closeMenu, disabled, checked }) => {
  const dispatch = useDispatch();
  const openSubMenus = useSelector((state: RootState) => state.contextMenu.openSubMenus);
  const isSubMenuVisible = path ? openSubMenus.includes(path) : false;

  const handleMouseEnter = useCallback(() => {
    if (items && items.length > 0 && path) {
      dispatch(setOpenSubMenu(path));
    }
  }, [dispatch, items, path]);

  const handleClick = useCallback(() => {
    if (onClick && !disabled) {
      onClick();
      if (path) {
        dispatch(setOpenSubMenu(path));
      }
      if (closeMenu && checked === undefined) {
        closeMenu();
      }
    }
  }, [onClick, disabled, path, closeMenu, checked, dispatch]);

  return (
    <StyledMenuItem onMouseEnter={handleMouseEnter} >
      <MenuItemContent disabled={disabled} onClick={handleClick}>
        {checked !== undefined && (
          <CheckboxIcon>
            {checked ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
          </CheckboxIcon>
        )}
        {children}
        {items && items.length > 0 && <SubMenuIndicator><MdChevronRight /></SubMenuIndicator>}
      </MenuItemContent>
      {isSubMenuVisible && (
        <SubMenu>
          {items?.map((item, index) => (
            <MenuItem key={index} closeMenu={closeMenu} {...item} />
          ))}
        </SubMenu>
      )}
    </StyledMenuItem>
  );
});