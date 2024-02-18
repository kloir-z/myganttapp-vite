// HolidaySetting.tsx
import React, { memo } from "react";
import { updateHolidays } from "../utils/settingHelpers";
import { setHolidayInput } from "../../../reduxStoreAndSlices/baseSettingsSlice";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../../reduxStoreAndSlices/store";
import { setHolidays } from "../../../reduxStoreAndSlices/store";
import SettingChildDiv from "../SettingChildDiv";

const HolidaySetting: React.FC = memo(() => {
  const dispatch = useDispatch();
  const holidayInput = useSelector((state: RootState) => state.baseSettings.holidayInput);
  const handleBlur = () => {
    dispatch(setHolidays(updateHolidays(holidayInput)))
  };

  return (
    <SettingChildDiv text='Holidays'>
      <textarea
        value={holidayInput}
        onChange={(e) => dispatch(setHolidayInput(e.target.value))}
        onBlur={handleBlur}
        style={{ padding: '10px', minWidth: '256px', minHeight: '300px', overflow: 'auto', whiteSpace: 'nowrap', backgroundColor: '#FFF', zIndex: '15' }}
      />
    </SettingChildDiv>
  );
});

export default HolidaySetting;