import { Dispatch, SetStateAction } from "react";
import { ExtendedColumn } from "../../Table/hooks/useWBSData";
import { ColorInfo } from "../../../reduxStoreAndSlices/colorSlice";
import { WBSData, RegularHolidaySetting } from "../../../types/DataTypes";
import { AppDispatch } from "../../../reduxStoreAndSlices/store";
import { updateAllColors } from "../../../reduxStoreAndSlices/colorSlice";
import { updateRegularHolidaySetting, simpleSetData, setHolidays } from "../../../reduxStoreAndSlices/store";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";

export const handleExport = (
  colors: ColorInfo[],
  fileName: string,
  dateRange: { startDate: Date, endDate: Date },
  columns: ExtendedColumn[],
  data: { [id: string]: WBSData },
  holidayInput: string,
  regularHolidaySetting: RegularHolidaySetting[],
  wbsWidth: number,
) => {
  const settingsData = {
    colors,
    dateRange: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    },
    columns,
    data,
    holidayInput,
    regularHolidaySetting,
    wbsWidth,
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
  setDateRange: Dispatch<SetStateAction<{ startDate: Date, endDate: Date }>>,
  setColumns: Dispatch<SetStateAction<ExtendedColumn[]>>,
  setWbsWidth: Dispatch<SetStateAction<number>>,
  dispatch: AppDispatch,
  setFileName: Dispatch<SetStateAction<string>>,
  setHolidayInput: Dispatch<SetStateAction<string>>,
  setStartDate: Dispatch<Dayjs | null>,
  setEndDate: Dispatch<Dayjs | null>
) => {
  if (file) {
    setFileName(file.name.replace('.json', ''));
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        try {
          const parsedData = JSON.parse(text);

          const importStatus = {
            colors: false,
            dateRange: false,
            columns: false,
            data: false,
          };

          if (parsedData.colors) {
            dispatch(updateAllColors(parsedData.colors));
            importStatus.colors = true;
          }
          if (parsedData.dateRange && parsedData.dateRange.startDate && parsedData.dateRange.endDate) {
            const newStartDate = new Date(parsedData.dateRange.startDate);
            const newEndDate = new Date(parsedData.dateRange.endDate);
            setDateRange({
              startDate: newStartDate,
              endDate: newEndDate
            });
            setStartDate(dayjs(newStartDate));
            setEndDate(dayjs(newEndDate));
            importStatus.dateRange = true;
          }
          if (parsedData.columns && Array.isArray(parsedData.columns)) {
            setColumns(parsedData.columns);
            importStatus.columns = true;
          }
          if (parsedData.regularHolidaySetting) {
            dispatch(updateRegularHolidaySetting(parsedData.regularHolidaySetting));
          }
          if (parsedData.holidayInput) {
            const newHolidayInput = parsedData.holidayInput;
            setHolidayInput(newHolidayInput);
            updateHolidays(newHolidayInput, dispatch)
          }
          if (parsedData.data) {
            dispatch(simpleSetData(parsedData.data));
            importStatus.data = true;
          }
          if (parsedData.wbsWidth) {
            setWbsWidth(parsedData.wbsWidth);
          }

          let message = 'Import Results:\n';
          Object.keys(importStatus).forEach((key) => {
            const typedKey = key as keyof typeof importStatus;
            message += `${typedKey}: ${importStatus[typedKey] ? 'Success' : 'Failed'}\n`;
          });

          alert(message);

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