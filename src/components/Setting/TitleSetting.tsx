import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { debounce } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { setTitle } from '../../reduxStoreAndSlices/baseSettingsSlice';

const InputWrapper = styled.div`
  position: absolute;
  left: 40px;
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

const StyledInput = styled.input`
  position: absolute;
  top: 0;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  left: 0;
  color: #000000ed;
  box-sizing: border-box;
  width: 100%;
  padding: 2px 4px;
  background: none;
  border: none;
  &:focus {
    outline: none;
    text-decoration:underline;
  }
`;

const TitleSetting: React.FC = () => {
  const dispatch = useDispatch();
  const globalTitle = useSelector((state: RootState) => state.baseSettings.title);
  const [title, setTitleLocal] = useState(globalTitle);
  const [isEditing, setIsEditing] = useState(false);
  const dummyRef = useRef<HTMLDivElement>(null);
  const placeholder = 'Project Name'

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleLocal(e.target.value);
  },[]);

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    if (dummyRef.current) {
      dummyRef.current.textContent = title || placeholder;
    }
  }, [title, placeholder]);

  useEffect(() => {
    if (!isEditing) {setTitleLocal(globalTitle)}
  }, [globalTitle, isEditing]);

  const syncToStore = useCallback(() => {
    if (isEditing) {
      dispatch(setTitle(title));
    }
  }, [isEditing, dispatch, title]);
  
  const debouncedSyncToStore = debounce(syncToStore, 100);
  
  useEffect(() => {
    debouncedSyncToStore();
    return () => debouncedSyncToStore.cancel();
  }, [debouncedSyncToStore]);

  const handleDoubleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  return (
    <InputWrapper>
      <AutoWidthDiv ref={dummyRef} data-placeholder={placeholder}></AutoWidthDiv>
      <StyledInput
        type="text"
        placeholder={placeholder}
        value={title}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onDoubleClick={handleDoubleClick}
      />
    </InputWrapper>
  );
};

export default TitleSetting;