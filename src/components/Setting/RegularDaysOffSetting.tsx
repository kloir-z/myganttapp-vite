import React, { useState, useCallback, memo } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { updateRegularDaysOffSetting } from "../../reduxStoreAndSlices/store";
import { ChromePicker, ColorResult } from 'react-color';
import SettingChildDiv from "./SettingChildDiv";
import { RegularDaysOffSetting } from "../../types/DataTypes";
import { adjustColorOpacity } from "../../utils/CommonUtils";

const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

const RegularDaysOffSettings: React.FC = memo(() => {
  const dispatch = useDispatch();
  const regularDaysOffSetting = useSelector((state: RootState) => state.wbsData.regularDaysOffSetting);
  const [localRegularDaysOffSettings, setLocalRegularDaysOffSettings] = useState<RegularDaysOffSetting[]>(regularDaysOffSetting);

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
    dispatch(updateRegularDaysOffSetting(localRegularDaysOffSettings));
  }, [dispatch, localRegularDaysOffSettings]);

  const handleColorChange = useCallback((id: number, color: string) => {
    setLocalRegularDaysOffSettings(current =>
      current.map(setting =>
        setting.id === id ? { ...setting, color, subColor: adjustColorOpacity(color) } : setting
      )
    );
  }, []);

  const handleDayChange = useCallback((id: number, changedDay: number) => {
    setLocalRegularDaysOffSettings(current => {
      const allDays = current.reduce((acc, setting) => [...acc, ...setting.days], [] as number[]);
      const newDays = current.map(setting => {
        if (setting.id !== id && setting.days.includes(changedDay)) {
          return { ...setting, days: setting.days.filter(day => day !== changedDay) };
        }
        if (setting.id === id) {
          const updatedDays = setting.days.includes(changedDay)
            ? setting.days.filter(day => day !== changedDay)
            : [...setting.days, changedDay];
          const uniqueDaysAfterAdding = new Set([...allDays, changedDay]);
          if (uniqueDaysAfterAdding.size === 7) {
            return setting;
          }
          return { ...setting, days: updatedDays };
        }
        return setting;
      });
      return newDays;
    });
  }, []);

  return (
    <SettingChildDiv text='Regular Days Off'>
      <table style={{ borderCollapse: 'collapse', width: '278px' }}>
        <thead>
          <tr>
            <th style={{ padding: '4px' }}></th>
            {daysOfWeek.map((day, index) => (
              <th key={index} style={{ padding: '4px' }}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {localRegularDaysOffSettings.map(setting => (
            <tr key={setting.id}>
              <td style={{ position: 'relative', width: '62px', height: '26px', display: 'flex', alignItems: 'flex-start', padding: '2px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '25px',
                    background: setting.color,
                    border: '1px solid #00000016',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    margin: 'auto'
                  }}
                  onClick={() => handleColorClick(setting.id)}
                ></div>
                {displayColorPicker[setting.id] && (
                  <div style={{ position: 'absolute', zIndex: '9999', left: '70px', top: '0px' }}>
                    <div style={{ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }} onClick={() => handleColorClose(setting.id)} />
                    <ChromePicker
                      color={setting.color}
                      onChange={(color: ColorResult) => {
                        const rgbaColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
                        handleColorChange(setting.id, rgbaColor);
                      }}
                    />
                  </div>
                )}
              </td>
              {daysOfWeek.map((_day, index) => (
                <td key={index} style={{ padding: '4px', textAlign: 'center' }} onClick={() => handleDayChange(setting.id, index)}>
                  <input
                    type="checkbox"
                    checked={setting.days.includes(index)}
                    readOnly
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleApplyChanges}>Apply</button>
      </div>
    </SettingChildDiv>
  );
});

export default RegularDaysOffSettings;