// HolidaySetting.tsx
import React, { memo, useCallback, useState } from "react";
import { updateHolidays } from "../utils/settingHelpers";
import { setHolidayInput } from "../../../reduxStoreAndSlices/baseSettingsSlice";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, updateHolidayColor } from "../../../reduxStoreAndSlices/store";
import { setHolidays } from "../../../reduxStoreAndSlices/store";
import SettingChildDiv from "../SettingChildDiv";
import { ChromePicker, ColorResult } from "react-color";

const HolidaySetting: React.FC = memo(() => {
  const dispatch = useDispatch();
  const holidayInput = useSelector((state: RootState) => state.baseSettings.holidayInput);
  const holidayColor = useSelector((state: RootState) => state.wbsData.holidayColor);
  const dateFormat = useSelector((state: RootState) => state.wbsData.dateFormat);
  const handleBlur = () => {
    dispatch(setHolidays(updateHolidays(holidayInput, dateFormat)))
  };
  const [displayColorPicker, setDisplayColorPicker] = useState<boolean>(false);

  const handleColorClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleColorClose = () => {
    setDisplayColorPicker(false);
  };

  const handleColorChange = useCallback((color: string) => {
    dispatch(updateHolidayColor(color));
  }, [dispatch]);

  return (
    <SettingChildDiv text='Public Holidays / Irregular Days Off'>
      <div
        style={{
          width: '60px',
          height: '25px',
          background: holidayColor.color,
          border: '1px solid #00000016',
          borderRadius: '2px',
          cursor: 'pointer',
        }}
        onClick={() => handleColorClick()}
      ></div>
      {displayColorPicker && (
        <div style={{ position: 'absolute', zIndex: '9999', left: '70px', top: '0px' }}>
          <div style={{ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }} onClick={() => handleColorClose()} />
          <ChromePicker
            color={holidayColor.color}
            onChange={(color: ColorResult) => {
              const rgbaColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
              handleColorChange(rgbaColor);
            }}
          />
        </div>
      )}
      <textarea
        value={holidayInput}
        onChange={(e) => dispatch(setHolidayInput(e.target.value))}
        onBlur={handleBlur}
        style={{ position: 'absolute', padding: '10px', top: '55px', minWidth: '256px', minHeight: '300px', overflow: 'auto', whiteSpace: 'nowrap', backgroundColor: '#FFF', zIndex: '15', fontSize: '0.73rem', fontFamily: 'Meiryo' }}
      />
      <div style={{ height: '340px' }}></div>

    </SettingChildDiv>
  );
});

export default HolidaySetting;