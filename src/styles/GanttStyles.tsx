//GridStyles.ts
import styled from 'styled-components';
import { css, keyframes } from 'styled-components';

export const GanttRow = styled.div`
  box-sizing: border-box;
  display: flex;
  height: 21px;
  background: none;
  border-bottom: solid 1px #00000016;
  position: relative;
  user-select: none;
  align-items: start;
  font-size: 0.8em;
`;

interface CellProps {
  $chartBarColor?: string;
  $left?: number;
  $width?: number;
}

export const Cell = styled.div<CellProps>`
  position: absolute;
  box-sizing: border-box;
  font-size: 0.8rem;
  text-align: center;
  left: ${props => props.$left ? `${props.$left}px` : ''};
  width: ${props => props.$width ? `${props.$width}px` : '21.1px'};
  height: 21px;
  border: 0.2px solid transparent;
  background-color: ${props => props.$chartBarColor ? props.$chartBarColor : '#99ff937e'};
  &:hover {
    border: ${props => props.$chartBarColor ? '0.2px solid #000dff5f' : '0.2px solid transparent'};
  }
`;

interface CalendarCellProps {
  $chartBarColor?: string;
  $isMonthStart?: boolean;
  $isFirstDate?: boolean;
  $borderLeft?: boolean;
}

export const CalendarCell = styled.div<CalendarCellProps>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  font-size: 0.8rem;
  height: 20px;
  border-left: ${props => {
    if (props.$isFirstDate) return 'none';
    if (props.$isMonthStart) return '1px solid #00000055';
    if (props.$borderLeft) return '1px solid #00000010';
    return 'none';
  }};
  background-color: ${props => props.$chartBarColor ? props.$chartBarColor : 'unset'};
`;

const createFadeAnimation = (fromOpacity: number, toOpacity: number) => keyframes`
  from { opacity: ${fromOpacity}};
  to { opacity: ${toOpacity}};
`;

const fadeAnimation = (fromOpacity: number, toOpacity: number) => css`
  animation: ${createFadeAnimation(fromOpacity, toOpacity)} 0.2s ease-out forwards;
`;

export const Overlay = styled.div<{ fadeStatus: 'in' | 'out' }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.163);
  display: flex;
  z-index: 11;
  ${props => props.fadeStatus === 'out' ? fadeAnimation(1, 0) : fadeAnimation(0, 1)}
  border: none;
  color: #ebebeb;
`;

export const ModalContainer = styled.div<{ fadeStatus: 'in' | 'out' }>`
  will-change: transform;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  padding-top: 20px;
  background: #ffffff;
  border: solid 1px rgb(83 87 97);
  border-radius: 5px;
  font-size: 0.8rem;
  z-index: 15;
  ${props => props.fadeStatus === 'out' ? fadeAnimation(1, 0) : fadeAnimation(0, 1)}
  color: #1b1b1b;
  max-height: 90svh;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 0px;
  right: 1px;
  cursor: pointer;
  font-size: 1.2rem;
  color: #252525;
  border: none;
  background: transparent;
  &:hover {
    color: #9b9b9b;
  }
`;