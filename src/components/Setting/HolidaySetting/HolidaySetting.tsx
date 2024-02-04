// HolidaySetting.tsx
import React, { Dispatch, memo, SetStateAction } from "react";
import { updateHolidays } from "../utils/settingHelpers";
import { useDispatch } from "react-redux";

type HolidaySettingProps = {
  holidayInput: string;
  setHolidayInput: Dispatch<SetStateAction<string>>;
};

const HolidaySetting: React.FC<HolidaySettingProps> = memo(({ holidayInput, setHolidayInput }) => {
  const dispatch = useDispatch();
  const handleBlur = () => {
    updateHolidays(holidayInput, dispatch);
  };

  return (
    <div style={{ marginLeft: '10px' }}>
      <textarea
        value={holidayInput}
        onChange={(e) => setHolidayInput(e.target.value)}
        onBlur={handleBlur}
        style={{ padding: '10px', width: '200px', height: '700px', overflow: 'auto', whiteSpace: 'nowrap' }}
      />
    </div>
  );
});

export default HolidaySetting;