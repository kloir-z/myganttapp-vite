import { memo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(120deg);
  }
`;

const rotateReverse = keyframes`
  from {
    transform: rotate(120deg);
  }
  to {
    transform: rotate(0deg);
  }
`;

export const AnimatedCog = styled(FaCog)`
  animation: ${rotateReverse} 200ms linear;

`;

export const StyledSettingButton = styled.button`
  font-size: 0.9rem;
  padding: 2px;
  background: none;
  border: none;
  opacity: 0.8;
  &:hover {
    ${AnimatedCog} {
      opacity: 0.5;
      animation: ${rotate} 200ms linear;
    }
  }
`;

const SettingButton: React.FC = memo(() => {
  const navigate = useNavigate();
  return (
    <StyledSettingButton onClick={() => navigate('/settings')}>
      <AnimatedCog />
      <span style={{ position: 'absolute', left: '-9999px' }}>Settings</span>
    </StyledSettingButton>
  );
});

export default SettingButton;