import { ExtendedColumn, setColumns, setShowYear } from "../../../reduxStoreAndSlices/store";
import { ColorInfo } from "../../../reduxStoreAndSlices/colorSlice";
import { WBSData, RegularDaysOffSetting } from "../../../types/DataTypes";
import { AppDispatch } from "../../../reduxStoreAndSlices/store";
import { updateAllColors } from "../../../reduxStoreAndSlices/colorSlice";
import { updateRegularDaysOffSetting, setEntireData, setHolidays } from "../../../reduxStoreAndSlices/store";
import { setWbsWidth, setDateRange, setHolidayInput, setFileName, setTitle, setCalendarWidth, setCellWidth } from "../../../reduxStoreAndSlices/baseSettingsSlice";
import { v4 as uuidv4 } from 'uuid';

export const handleExport = (
  colors: ColorInfo[],
  fileName: string,
  dateRange: { startDate: string, endDate: string },
  columns: ExtendedColumn[],
  data: { [id: string]: WBSData },
  holidayInput: string,
  regularDaysOffSetting: RegularDaysOffSetting[],
  wbsWidth: number,
  calendarWidth: number,
  cellWidth: number,
  title: string,
  showYear: boolean,
) => {
  const settingsData = {
    colors,
    dateRange,
    columns,
    data,
    holidayInput,
    regularDaysOffSetting,
    wbsWidth,
    title,
    showYear,
    calendarWidth,
    cellWidth,
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

export const handleAppend = (
  data: { [id: string]: WBSData },
  file: File,
  dispatch: AppDispatch,
) => {
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        try {
          const parsedData = JSON.parse(text);
          if (parsedData.data && typeof parsedData.data === 'object' && !Array.isArray(parsedData.data)) {
            let maxNo = Object.values(data).reduce((max, curr) => curr.no > max ? curr.no : max, 0);

            const newData = Object.entries(parsedData.data).reduce((acc: { [id: string]: WBSData }, [, row]) => {
              const newNo = ++maxNo;
              const newId = uuidv4();
              acc[newId] = { ...(row as WBSData), no: newNo, id: newId };
              return acc;
            }, {} as { [id: string]: WBSData });
            const updatedData = { ...data, ...newData };
            dispatch(setEntireData(updatedData));
          }
        } catch (error) {
          alert("Error: An error occurred while loading the file.");
        }
      }
    };
    reader.readAsText(file);
  }
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
          if (parsedData.regularDaysOffSetting) {
            dispatch(updateRegularDaysOffSetting(parsedData.regularDaysOffSetting));
          }
          if (parsedData.holidayInput) {
            const newHolidayInput = parsedData.holidayInput;
            dispatch(setHolidayInput(newHolidayInput));
            dispatch(setHolidays(updateHolidays(newHolidayInput)));
          }
          if (parsedData.data) {
            dispatch(setEntireData(parsedData.data));
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
          if (parsedData.calendarWidth) {
            dispatch(setCalendarWidth(parsedData.calendarWidth));
          }
          if (parsedData.cellWidth) {
            dispatch(setCellWidth(parsedData.cellWidth));
          }
        } catch (error) {
          alert("Error: An error occurred while loading the file.");
        }
      }
    };
    reader.readAsText(file);
  }
};

export const updateHolidays = (holidayInput: string) => {
  const newHolidays = holidayInput.split("\n").map(holiday => {
    const match = holiday.match(/(\d{4})[/-]?(\d{1,2})[/-]?(\d{1,2})/);
    if (match) {
      const [, year, month, day] = match;
      const formattedMonth = month.padStart(2, '0');
      const formattedDay = day.padStart(2, '0');
      return `${year}/${formattedMonth}/${formattedDay}`;
    }
    return null;
  }).filter((holiday): holiday is string => holiday !== null);

  return newHolidays
};