import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { updateAllColors } from '../../reduxStoreAndSlices/colorSlice';
import { ChromePicker, ColorResult } from 'react-color';
import SettingChildDiv from "./SettingChildDiv";
import { ColorInfo } from "../../reduxStoreAndSlices/colorSlice";
import { debounce } from 'lodash';

const ColorSetting: React.FC = () => {
  const dispatch = useDispatch();
  const colors = useSelector((state: RootState) => state.color.colors);
  const [localColors, setLocalColors] = useState<ColorInfo[]>(colors)
  const [isEditing, setIsEditing] = useState(false);

  type DisplayColorPickerType = { [key: number]: boolean };
  const [displayColorPicker, setDisplayColorPicker] = useState<DisplayColorPickerType>({});

  const handleColorClick = (id: number) => {
    setDisplayColorPicker({ ...displayColorPicker, [id]: !displayColorPicker[id] });
    setIsEditing(true);
  };

  const handleColorClose = (id: number) => {
    setDisplayColorPicker({ ...displayColorPicker, [id]: false });
    setIsEditing(false);
  };

  const handleColorChange = useCallback((id: number, newColor: string) => {
    setLocalColors(currentColors =>
      currentColors.map(color =>
        color.id === id ? { ...color, color: newColor } : color
      )
    );
  }, []);

  const handleAliasChange = useCallback((id: number, newAlias: string) => {
    setLocalColors(currentColors =>
      currentColors.map(color =>
        color.id === id ? { ...color, alias: newAlias } : color
      )
    );
  }, []);

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isEditing) { setLocalColors(colors) }
    console.log(isEditing)
  }, [isEditing, colors]);

  const syncToStore = useCallback(() => {
    if (isEditing) {
      dispatch(updateAllColors(localColors));
    }
  }, [dispatch, isEditing, localColors]);

  const debouncedSyncToStore = useMemo(() => debounce(syncToStore, 10), [syncToStore]);

  useEffect(() => {
    debouncedSyncToStore();
    return () => debouncedSyncToStore.cancel();
  }, [debouncedSyncToStore]);

  return (
    <SettingChildDiv text='Chart Color (Alias)'>
      {localColors.map(colorInfo => (
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
              <div style={{ position: 'absolute', left: '63px', zIndex: '9999' }}>
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
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          )}
        </div>
      ))}
    </SettingChildDiv>
  );
};

export default ColorSetting;