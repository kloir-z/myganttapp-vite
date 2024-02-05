import { ExtendedColumn } from "../../../reduxStoreAndSlices/baseSettingsSlice";
import { ColorInfo } from "../../../reduxStoreAndSlices/colorSlice";
import { WBSData, RegularHolidaySetting } from "../../../types/DataTypes";
import { AppDispatch } from "../../../reduxStoreAndSlices/store";
import { updateAllColors } from "../../../reduxStoreAndSlices/colorSlice";
import { updateRegularHolidaySetting, simpleSetData, setHolidays } from "../../../reduxStoreAndSlices/store";
import { setWbsWidth, setDateRange, setHolidayInput, setFileName, setTitle, setColumns, setShowYear } from "../../../reduxStoreAndSlices/baseSettingsSlice";

export const handleExport = (
  colors: ColorInfo[],
  fileName: string,
  dateRange: { startDate: string, endDate: string },
  columns: ExtendedColumn[],
  data: { [id: string]: WBSData },
  holidayInput: string,
  regularHolidaySetting: RegularHolidaySetting[],
  wbsWidth: number,
  title: string,
  showYear: boolean,
) => {
  const settingsData = {
    colors,
    dateRange,
    columns,
    data,
    holidayInput,
    regularHolidaySetting,
    wbsWidth,
    title,
    showYear
  };
  const jsonData = JSON.stringify(settingsData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const handleImport = (
  file: File,
  dispatch: AppDispatch,
) => {
  if (file) {
    dispatch(setFileName(file.name.replace('.json', '')));
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        try {
          const parsedData = JSON.parse(text);

          if (parsedData.colors) {
            dispatch(updateAllColors(parsedData.colors));
          }
          if (parsedData.dateRange && parsedData.dateRange.startDate && parsedData.dateRange.endDate) {
            dispatch(setDateRange({
              startDate: parsedData.dateRange.startDate,
              endDate: parsedData.dateRange.endDate
            }));
          }
          if (parsedData.columns && Array.isArray(parsedData.columns)) {
            dispatch(setColumns(parsedData.columns));
          }
          if (parsedData.regularHolidaySetting) {
            dispatch(updateRegularHolidaySetting(parsedData.regularHolidaySetting));
          }
          if (parsedData.holidayInput) {
            const newHolidayInput = parsedData.holidayInput;
            dispatch(setHolidayInput(newHolidayInput));
            updateHolidays(newHolidayInput, dispatch)
          }
          if (parsedData.data) {
            dispatch(simpleSetData(parsedData.data));
          }
          if (parsedData.wbsWidth) {
            dispatch(setWbsWidth(parsedData.wbsWidth));
          }
          if (parsedData.title) {
            dispatch(setTitle(parsedData.title));
          }
          if (parsedData.showYear) {
            dispatch(setShowYear(parsedData.showYear));
          }

        } catch (error) {
          alert("Error: An error occurred while loading the file.");
        }
      }
    };
    reader.readAsText(file);
  }
};

export const updateHolidays = (
  holidayInput: string,
  dispatch: AppDispatch,
) => {
  const newHolidays = holidayInput.split("\n").map(holiday => {
    const match = holiday.match(/(\d{4})[/-]?(\d{1,2})[/-]?(\d{1,2})/);
    if (match) {
      const [, year, month, day] = match;
      const formattedMonth = month.padStart(2, '0');
      const formattedDay = day.padStart(2, '0');
      return `${year}-${formattedMonth}-${formattedDay}`;
    }
    return null;
  }).filter((holiday): holiday is string => holiday !== null);

  dispatch(setHolidays(newHolidays));
};