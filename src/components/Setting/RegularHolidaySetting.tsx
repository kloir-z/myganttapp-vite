import React, { useState, useCallback } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { updateRegularHolidaySetting } from "../../reduxStoreAndSlices/store";
import { ChromePicker, ColorResult } from 'react-color';
const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

const ReguralHolidaySetting: React.FC = () => {
  const dispatch = useDispatch();
  const regularHolidaySetting = useSelector((state: RootState) => state.wbsData.present.regularHolidaySetting);
  const [localRegularHolidaySettings, setLocalRegularHolidaySettings] = useState(regularHolidaySetting);

  type DisplayColorPickerType = { [key: number]: boolean };
  const [displayColorPicker, setDisplayColorPicker] = useState<DisplayColorPickerType>({});

  const handleColorClick = (id: number) => {
    setDisplayColorPicker({ ...displayColorPicker, [id]: !displayColorPicker[id] });
  };

  const handleColorClose = (id: number) => {
    setDisplayColorPicker({ ...displayColorPicker, [id]: false });
    handleApplyChanges();
  };

  const handleApplyChanges = useCallback(() => {
    dispatch(updateRegularHolidaySetting(localRegularHolidaySettings));
  }, [dispatch, localRegularHolidaySettings]);

  const handleColorChange = useCallback((id: number, color: string) => {
    setLocalRegularHolidaySettings(current =>
      current.map(setting =>
        setting.id === id ? { ...setting, color } : setting
      )
    );
  }, []);

  const handleDayChange = useCallback((id: number, changedDay: number) => {
    setLocalRegularHolidaySettings(current =>
      current.map(setting => {
        if (setting.id === id) {
          const updatedDays = setting.days.includes(changedDay)
            ? setting.days.filter(day => day !== changedDay)
            : [...setting.days, changedDay];
          return { ...setting, days: updatedDays };
        }
        return setting;
      })
    );
  }, []);

  return (
    <div style={{ marginLeft: '10px' }}>
      {localRegularHolidaySettings.map(setting => (
        <div key={setting.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '10px' }}>
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
                background: setting.color,
                border: '1px solid #00000016',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              onClick={() => handleColorClick(setting.id)}
            >
            </div>
            {displayColorPicker[setting.id] ? (
              <div style={{ position: 'absolute', left: '63px', zIndex: '9999' }}>
                <div style={{ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }} onClick={() => handleColorClose(setting.id)} />
                <div onClick={(e) => e.stopPropagation()}>
                  <ChromePicker
                    color={setting.color}
                    onChange={(color: ColorResult) => {
                      const rgbaColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
                      handleColorChange(setting.id, rgbaColor);
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <div style={{ display: 'flex', justifyContent: 'start' }}>
            {daysOfWeek.map((day, index) => (
              <label key={index} style={{ marginRight: '2px' }}>
                {day}
                <input
                  type="checkbox"
                  checked={setting.days.includes(index)}
                  onChange={() => handleDayChange(setting.id, index)}
                  style={{ marginLeft: '2px' }}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <button onClick={handleApplyChanges}>Apply</button>
      </div>
    </div>
  );
};

export default ReguralHolidaySetting;
