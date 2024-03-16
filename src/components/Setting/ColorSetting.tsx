import React, { useState, useCallback, useReducer, memo } from "react";
import { useDispatch } from 'react-redux';
import { updateColor, updateAlias } from '../../reduxStoreAndSlices/colorSlice';
import { ChromePicker, ColorResult } from 'react-color';
import SettingChildDiv from "./SettingChildDiv";
import { store } from "../../reduxStoreAndSlices/store";
import { ColorState } from "../../reduxStoreAndSlices/colorSlice";

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
  const dispatch = useDispatch();
  const [state, localDispatch] = useReducer(colorReducer, store.getState().color);

  type DisplayColorPickerType = { [key: number]: boolean };
  const [displayColorPicker, setDisplayColorPicker] = useState<DisplayColorPickerType>({});

  const handleColorClick = (id: number) => {
    setDisplayColorPicker({ ...displayColorPicker, [id]: !displayColorPicker[id] });
  };

  const handleColorClose = (id: number) => {
    setDisplayColorPicker({ ...displayColorPicker, [id]: false });
  };

  const handleColorChange = useCallback((id: number, color: string) => {
    localDispatch({ type: "UPDATE_COLOR", payload: { id: id, color: color } })
    dispatch(updateColor({ id, color }));
  }, [dispatch]);

  const handleAliasChange = useCallback((id: number, alias: string) => {
    localDispatch({ type: "UPDATE_ALIAS", payload: { id: id, alias: alias } })
    dispatch(updateAlias({ id, alias }));
  }, [dispatch]);

  return (
    <SettingChildDiv text='Chart Color (Alias)'>
      {state.colors.map(colorInfo => (
        <div key={colorInfo.id} style={{ display: 'flex', flexDirection: 'row' }}>
          <div
            style={{
              width: '50px',
              height: '15px',
              padding: '5px',
              margin: '2px',
              background: 'white',
              borderRadius: '5px',
              position: 'relative'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: colorInfo.color,
                border: '1px solid #00000016',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              onClick={() => handleColorClick(colorInfo.id)}
            >
            </div>
            {displayColorPicker[colorInfo.id] ? (
              <div style={{ position: 'absolute', top: '29px', left: '33px', zIndex: '9999' }}>
                <div style={{ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }} onClick={() => handleColorClose(colorInfo.id)} />
                <div onClick={(e) => e.stopPropagation()}>
                  <ChromePicker
                    color={colorInfo.color}
                    onChange={(color: ColorResult) => {
                      const rgbaColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
                      handleColorChange(colorInfo.id, rgbaColor);
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
          {colorInfo.id === 999 ? (
            <span style={{ margin: 'auto 0', marginLeft: '10px' }}>Actual Chart Color</span>
          ) : (
            <input
              type="text"
              value={colorInfo.alias}
              onChange={(e) => handleAliasChange(colorInfo.id, e.target.value)}
              style={{ height: '20px', margin: '2px' }}
            />
          )}
        </div>
      ))}
    </SettingChildDiv>
  );
});

export default ColorSetting;