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

const StyledReadOnlyInput = styled.input<StyledInputProps>`
  position: absolute;
  top: 0;
  left: 0;
  color: #000000ef;
  box-sizing: border-box;
  height: 21px;
  width: 100%;
  padding: 2px 4px;
  background: none;
  border: none;
  cursor: 'default';
  user-select: none;
`;

const StyledInput = styled.input<StyledInputProps>`
  position: absolute;
  top: 0;
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
  const [isEditingText, setIsEditingText] = useState(false);
  const originalDisplayNameRef = useRef<string | undefined>(undefined);
  const dummyRef = useRef<HTMLDivElement>(null);
  const placeholder = '    '

  const handleFocus = () => {
    setIsEditingText(true);
    originalDisplayNameRef.current = localDisplayName;
    dispatch(pushPastState());
  };

  const handleBlur = () => {
    if (originalDisplayNameRef.current === localDisplayName) {
      dispatch(removePastState(1));
      originalDisplayNameRef.current = undefined;
    }
    setIsEditingText(false);
    syncToStore();
  };

  useEffect(() => {
    if (isBarDragged && originalDisplayNameRef.current === localDisplayName) {
      dispatch(removePastState(1));
      originalDisplayNameRef.current = undefined;
    }
    setIsEditingText(false);
    syncToStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBarDragged]);

  useEffect(() => {
    if (dummyRef.current) {
      dummyRef.current.textContent = localDisplayName || placeholder;
    }
  }, [localDisplayName, placeholder]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalDisplayName(e.target.value);
  };

  useEffect(() => {
    setLocalDisplayName(storeDisplayName)
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
        <StyledReadOnlyInput
          type="text"
          readOnly={true}
          value={localDisplayName}
          onBlur={handleBlur}
        />
      ) : (
        <StyledInput
          type="text"
          placeholder={placeholder}
          value={localDisplayName}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          $isEditingText={isEditingText}
        />
      )}
    </InputWrapper>
  );
});

export default AutoWidthInputBox;