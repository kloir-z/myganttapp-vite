import React, { useState, useCallback } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { updateColor, updateAlias } from '../../reduxStoreAndSlices/colorSlice';
import { ChromePicker, ColorResult } from 'react-color';

const ColorSetting: React.FC = () => {
  const dispatch = useDispatch();
  const colors = useSelector((state: RootState) => state.color.colors);

  type DisplayColorPickerType = { [key: number]: boolean };
  const [displayColorPicker, setDisplayColorPicker] = useState<DisplayColorPickerType>({});

  const handleColorClick = (id: number) => {
    setDisplayColorPicker({ ...displayColorPicker, [id]: !displayColorPicker[id] });
  };

  const handleColorClose = (id: number) => {
    setDisplayColorPicker({ ...displayColorPicker, [id]: false });
  };

  const handleColorChange = useCallback((id: number, color: string) => {
    dispatch(updateColor({ id, color }));
  }, [dispatch]);

  const handleAliasChange = useCallback((id: number, alias: string) => {
    dispatch(updateAlias({ id, alias }));
  }, [dispatch]);

  return (
    <div style={{ marginLeft: '10px' }}>
      {colors.map(colorInfo => (
        <div key={colorInfo.id} style={{display: 'flex', flexDirection: 'row'}}>
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
            { displayColorPicker[colorInfo.id] ? (
              <div style={{ position: 'absolute', left: '63px', zIndex: '9999' }}>
                <div style={{ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }} onClick={() => handleColorClose(colorInfo.id)}/>
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
            ) : null }
          </div>
          <input
            type="text"
            value={colorInfo.alias}
            onChange={(e) => handleAliasChange(colorInfo.id, e.target.value)}
            style={{height: '20px', margin: '2px'}}
          />
        </div>
      ))}
    </div>
  );
};

export default ColorSetting;