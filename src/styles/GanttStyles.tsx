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
  $type?: string;
  $isPlanned?: boolean;
  $isActual?: boolean;
  $chartBarColor?: string;
  $width?: number;
  $isMonthStart?: boolean;
  $isFirstDate?: boolean;
  $borderLeft?: boolean;
}

export const Cell = styled.div<CellProps>`
  box-sizing: border-box;
  font-size: 0.8rem;
  text-align: center;
  width: ${props => (props.$width ? `${props.$width}px` : '21.1px')};
  height: 21px;
  border: 1px solid transparent;
  border-left: ${props => {
    return (props.$isPlanned || props.$isActual) ? '1px solid transparent' : '1px solid #00000010';
  }};
  background-color: ${props => {
    if (props.$isPlanned) {
      return props.$chartBarColor ? props.$chartBarColor : '#76ff7051';
    }
    if (props.$isActual) {
      return props.$chartBarColor ? props.$chartBarColor : '#0000003d';
    }
  }};
  &:hover {
    border: ${props => ((props.$isPlanned || props.$isActual) ? '1px solid #001aff83' : '1px solid transparent')};
    border-left: ${props => {
    return (props.$isPlanned || props.$isActual) ? '1px solid #001aff83' : '1px solid #00000016';
  }};
  }
`;

export const CalendarCell = styled.div<CellProps>`
  box-sizing: border-box;
  font-size: 0.8rem;
  text-align: center;
  height: 21px;
  border: 1px solid transparent;
  border-left: ${props => {
    if (props.$isFirstDate) return 'none';
    if (props.$isMonthStart) return '1px solid #00000055';
    if (props.$borderLeft) return '1px solid #00000010';
    return 'none';
  }};
  background-color: ${props => {
    if (props.$type === 'vertical') {
      return props.$chartBarColor ? props.$chartBarColor : '#ffffff';
    }
  }};
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
  align-items: center;
  justify-content: center;
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
  margin: 25px;
  padding-top: 20px;
  background: #ffffff;
  border: solid 1px rgb(83 87 97);
  border-radius: 5px;
  font-size: 0.8rem;
  z-index: 15;
  ${props => props.fadeStatus === 'out' ? fadeAnimation(1, 0) : fadeAnimation(0, 1)}
  color: #1b1b1b;
  height: 1000px;
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