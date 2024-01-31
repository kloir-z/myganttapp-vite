// HolidaySetting.tsx
import React, { Dispatch, memo, SetStateAction } from "react";

type HolidaySettingProps = {
  updateHolidays: (holidayInput: string) => void;
  holidayInput: string;
  setHolidayInput: Dispatch<SetStateAction<string>>;
};

const HolidaySetting: React.FC<HolidaySettingProps> = memo(({ updateHolidays, holidayInput, setHolidayInput }) => {
  const handleBlur = () => {
    updateHolidays(holidayInput);
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