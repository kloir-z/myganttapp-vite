// AutoWidthInputBox.tsx
import React, { useState, useRef, useEffect, useCallback, ChangeEvent, memo } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setDisplayName, setEventDisplayName, pushPastState, removePastState } from '../reduxStoreAndSlices/store';
import { isEventRow } from '../types/DataTypes';

const InputWrapper = styled.div`
  position: absolute;
  left: 0;
  display: inline-block;
`;

const AutoWidthDiv = styled.div`
  display: inline-block;
  box-sizing: border-box;
  overflow: hidden;
  min-width: 2em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  font-size: 0.8rem;
  padding: 2px 5px;
  white-space: nowrap;
  opacity: 0;
  &::before {
    content: '';
  }
  &:empty::before {
    content: attr(data-placeholder);
  }
`;

interface StyledInputProps {
  $isEditingText?: boolean;
}

const StyledLabel = styled.label<StyledInputProps>`
  position: absolute;
  top: 0;
  font-size: 0.8rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  left: 0;
  color: #000000ef;
  box-sizing: border-box;
  height: 21px;
  width: 100%;
  padding: 2px 4px;
  background: none;
  border: none;
  cursor: 'default';
`;

const StyledInput = styled.input<StyledInputProps>`
  position: absolute;
  top: 0;
  font-size: 0.8rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  left: 0;
  color: #000000ef;
  box-sizing: border-box;
  height: 21px;
  width: 100%;
  padding: 2px 4px;
  background: none;
  border: none;
  cursor: ${props => props.$isEditingText ? 'text' : 'default'};
  &:focus {
    outline: none;
    text-decoration:underline;
  }
`;

interface AutoWidthInputBoxProps {
  entryId: string;
  eventIndex?: number;
  isBarDragged?: boolean;
}

const AutoWidthInputBox: React.FC<AutoWidthInputBoxProps> = memo(({
  entryId,
  eventIndex,
  isBarDragged
}) => {
  const storeDisplayName = useSelector((state: RootState) => {
    const rowData = state.wbsData.data[entryId];
    if (isEventRow(rowData) && typeof eventIndex === 'number') {
      if (rowData.eventData && rowData.eventData[eventIndex]) {
        return rowData.eventData[eventIndex].eachDisplayName;
      } else {
        return "";
      }
    }
    return rowData?.displayName;
  });
  const dispatch = useDispatch();
  const [localDisplayName, setLocalDisplayName] = useState(storeDisplayName);
  const [originalDisplayName, setOriginalDisplayName] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);
  const dummyRef = useRef<HTMLDivElement>(null);
  const placeholder = '    '

  const handleForcus = () => {
    setIsEditingText(true);
    setOriginalDisplayName(localDisplayName);
    dispatch(pushPastState());
  };

  const handleBlur = () => {
    setIsEditingText(false);
    if (originalDisplayName === localDisplayName) {
      dispatch(removePastState(1));
    }
    syncToStore();
  };

  useEffect(() => {
    if (dummyRef.current) {
      dummyRef.current.textContent = localDisplayName || placeholder;
    }
  }, [localDisplayName, placeholder]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalDisplayName(e.target.value);
  };

  useEffect(() => {
    if (!isEditingText) { setLocalDisplayName(storeDisplayName) }
  }, [storeDisplayName, isEditingText]);

  const syncToStore = useCallback(() => {
    if (isEditingText) {
      if (typeof eventIndex === 'number') {
        dispatch(setEventDisplayName({ id: entryId, eventIndex, displayName: localDisplayName }));
      } else {
        dispatch(setDisplayName({ id: entryId, displayName: localDisplayName }));
      }
    }
  }, [entryId, eventIndex, localDisplayName, dispatch, isEditingText]);

  const handleDoubleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <InputWrapper>
      <AutoWidthDiv
        ref={dummyRef}
        data-placeholder={placeholder}
      ></AutoWidthDiv>
      {isBarDragged ? (
        <StyledLabel>{localDisplayName || placeholder}</StyledLabel>
      ) : (
        <StyledInput
          type="text"
          placeholder={placeholder}
          value={localDisplayName}
          onChange={handleChange}
          onFocus={handleForcus}
          onBlur={handleBlur}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          $isEditingText={isEditingText}
        />
      )}
         <StyledInput
          type="text"
          placeholder={placeholder}
          value={localDisplayName}
          onChange={handleChange}
          onFocus={handleForcus}
          onBlur={handleBlur}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          $isEditingText={isEditingText}
        />
       <StyledLabel>{localDisplayName || placeholder}</StyledLabel>
    </InputWrapper>
  );
});

export default AutoWidthInputBox;