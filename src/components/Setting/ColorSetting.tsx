import React, { useState, useCallback, useReducer, memo } from "react";
import { useDispatch } from 'react-redux';
import { updateColor, updateAlias } from '../../reduxStoreAndSlices/colorSlice';
import { ColorResult } from 'react-color';
import SettingChildDiv from "./SettingChildDiv";
import { store } from "../../reduxStoreAndSlices/store";
import { ColorState } from "../../reduxStoreAndSlices/colorSlice";
import ColorInfoItem from "./ColorInfoItem";
import { useTranslation } from "react-i18next";

type ColorAction =
  | { type: 'UPDATE_COLOR'; payload: { id: number; color: string } }
  | { type: 'UPDATE_ALIAS'; payload: { id: number; alias: string } }

function colorReducer(state: ColorState, action: ColorAction): ColorState {
  switch (action.type) {
    case 'UPDATE_COLOR':
      return {
        ...state,
        colors: state.colors.map(color =>
          color.id === action.payload.id ? { ...color, color: action.payload.color } : color
        ),
      };
    case 'UPDATE_ALIAS':
      return {
        ...state,
        colors: state.colors.map(color =>
          color.id === action.payload.id ? { ...color, alias: action.payload.alias } : color
        ),
      };
    default:
      return state;
  }
}

const ColorSetting: React.FC = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [state, localDispatch] = useReducer(colorReducer, store.getState().color);

  type DisplayColorPickerType = { [key: number]: boolean };
  const [displayColorPicker, setDisplayColorPicker] = useState<DisplayColorPickerType>({});

  const handleColorClick = useCallback((id: number) => {
    setDisplayColorPicker(prevState => ({ ...prevState, [id]: !prevState[id] }));
  }, []);

  const handleColorClose = useCallback((id: number) => {
    setDisplayColorPicker(prevState => ({ ...prevState, [id]: false }));
  }, []);

  const handleColorChange = useCallback((id: number, color: string) => {
    localDispatch({ type: "UPDATE_COLOR", payload: { id: id, color: color } })
    dispatch(updateColor({ id, color }));
  }, [dispatch]);

  const handleAliasChange = useCallback((id: number, alias: string) => {
    localDispatch({ type: "UPDATE_ALIAS", payload: { id: id, alias: alias } })
    dispatch(updateAlias({ id, alias }));
  }, [dispatch]);

  const makeColorChangeHandler = useCallback((id: number) => (color: ColorResult) => {
    const rgbaColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
    handleColorChange(id, rgbaColor);
  }, [handleColorChange]);

  return (
    <SettingChildDiv text={t('Chart Color (Alias)')}>
      {state.colors.map(colorInfo => (
        <ColorInfoItem
          key={colorInfo.id}
          colorInfo={colorInfo}
          handleColorClick={handleColorClick}
          handleColorClose={handleColorClose}
          handleAliasChange={handleAliasChange}
          makeColorChangeHandler={makeColorChangeHandler}
          displayColorPicker={displayColorPicker[colorInfo.id]}
        />
      ))}
    </SettingChildDiv>
  );
});

export default ColorSetting;