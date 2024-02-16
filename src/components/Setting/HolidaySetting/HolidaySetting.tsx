// HolidaySetting.tsx
import React, { memo } from "react";
import { updateHolidays } from "../utils/settingHelpers";
import { setHolidayInput } from "../../../reduxStoreAndSlices/baseSettingsSlice";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../../reduxStoreAndSlices/store";
import { setHolidays } from "../../../reduxStoreAndSlices/store";

const HolidaySetting: React.FC = memo(() => {
  const dispatch = useDispatch();
  const holidayInput = useSelector((state: RootState) => state.baseSettings.holidayInput);
  const handleBlur = () => {
    dispatch(setHolidays(updateHolidays(holidayInput)))
  };

  return (
    <div style={{ marginLeft: '10px' }}>
      <textarea
        value={holidayInput}
        onChange={(e) => dispatch(setHolidayInput(e.target.value))}
        onBlur={handleBlur}
        style={{ padding: '10px', width: '200px', height: '700px', overflow: 'auto', whiteSpace: 'nowrap' }}
      />
    </div>
  );
});

export default HolidaySetting;