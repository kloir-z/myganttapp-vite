// SettingsModal.tsx
import React, { useState, useEffect, useRef, Dispatch, memo, SetStateAction } from "react";
import { Overlay, ModalContainer } from "../../styles/GanttStyles";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, simpleSetData, setHolidays } from '../../reduxStoreAndSlices/store';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/en-in';
import 'dayjs/locale/en';
import { ExtendedColumn } from "../Table/hooks/useWBSData";
import { updateAllColors } from '../../reduxStoreAndSlices/colorSlice';
import ColorSetting from "./ColorSetting";
import ColumnSetting from "./ColumnSetting/ColumnSetting";

type SettingsModalProps = {
  show: boolean;
  onClose: () => void;
  dateRange: { startDate: Date, endDate: Date };
  setDateRange: (range: { startDate: Date, endDate: Date }) => void;
  columns: ExtendedColumn[];
  setColumns: Dispatch<SetStateAction<ExtendedColumn[]>>;
  toggleColumnVisibility: (columnId: string | number) => void;
  wbsWidth: number;
  setWbsWidth: Dispatch<SetStateAction<number>>;
};

const SettingsModal: React.FC<SettingsModalProps> = memo(({ show, onClose, dateRange, setDateRange, columns, setColumns, toggleColumnVisibility, wbsWidth, setWbsWidth }) => {
  const dispatch = useDispatch();
  const [fadeStatus, setFadeStatus] = useState<'in' | 'out'>('in');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs(dateRange.startDate));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs(dateRange.endDate));
  const data = useSelector((state: RootState) => state.wbsData.present.data);
  const holidays = useSelector((state: RootState) => state.wbsData.present.holidays) as string[];
  const [holidayInput, setHolidayInput] = useState(holidays.join("\n"));
  const colors = useSelector((state: RootState) => state.color.colors);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const browserLocale = navigator.language;
  let locale;
  if (["ja", "zh", "ko", "hu"].includes(browserLocale)) {
    locale = 'en-ca';
  } else if (["in", "sa", "eu", "au"].includes(browserLocale)) {
    locale = 'en-in';
  } else {
    locale = 'en';
  }

  const updateHolidays = (holidayInput: string) => {
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
    dispatch(simpleSetData(data));
  };

  const handleBlur = () => {
    updateHolidays(holidayInput);
  };

  const handleExport = () => {
    const settingsData = {
      colors,
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      },
      columns,
      data,
      holidayInput,
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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
            if (parsedData.holidayInput) {
              const newHolidayInput = parsedData.holidayInput;
              setHolidayInput(newHolidayInput);
              updateHolidays(newHolidayInput);
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

  const isValidDateRange = (date: Dayjs) => {
    const earliestDate = dayjs('1900-01-01');
    const latestDate = dayjs('2099-12-31');
    return date.isAfter(earliestDate) && date.isBefore(latestDate);
  };

  useEffect(() => {
    if (startDate && endDate && startDate.isValid() && endDate.isValid()) {
      if (!isValidDateRange(startDate)) {
        setStartDate(dayjs());
        return;
      }

      const maxEndDate = dayjs(startDate).add(5, 'year');
      if (endDate.isAfter(maxEndDate)) {
        setEndDate(maxEndDate);
      } else {
        setDateRange({ startDate: startDate.toDate(), endDate: endDate.toDate() });
      }
    }
  }, [startDate, endDate, setDateRange]);

  const handleStartDateChange = (date: Dayjs | null) => {
    if (!date || !isValidDateRange(date)) {
      return;
    }
    setStartDate(date);
  
    if (!endDate || date.isAfter(endDate)) {
      const newMaxEndDate = dayjs(date).add(7, 'day');
      setEndDate(newMaxEndDate);
    }
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    if (!date || !isValidDateRange(date) || (startDate && startDate.isAfter(date))) {
      return;
    }
    setEndDate(date);
  };

  const handleClose = () => {
    setFadeStatus('out');
    setTimeout(() => {
      setFadeStatus('in');
      onClose();
    }, 210);
  };

  return (
    show ? 
    <Overlay fadeStatus={fadeStatus} onMouseDown={handleClose}>
      <ModalContainer fadeStatus={fadeStatus} onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div style={{ border: '1px solid #AAA',borderRadius: '4px', padding: '10px 10px', margin: '0px 10px'}}>
            <h3>Chart Date Range</h3>
            <div style={{ marginLeft: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', position: 'relative' }}>
                <LocalizationProvider
                  dateFormats={locale === 'en-ca' ? { monthAndYear: 'YYYY / MM' } : undefined}
                  dateAdapter={AdapterDayjs}
                  adapterLocale={locale}
                >
                  <DatePicker
                    label="Clendar Start"
                    value={startDate}
                    onChange={handleStartDateChange}
                    sx={{
                      '& .MuiInputBase-root': {
                        borderRadius: '4px',
                        padding: '0px'
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.8rem',
                        padding: '5px',
                        width: '70px',
                      },
                      '& .MuiButtonBase-root': {
                        fontSize: '0.8rem',
                        padding: '3px',
                        margin: '0px'
                      },
                    }}
                  />
                  <DatePicker
                    label="Calendar End"
                    value={endDate}
                    onChange={handleEndDateChange}
                    sx={{
                      '& .MuiInputBase-root': {
                        borderRadius: '4px',
                        padding: '0px'
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.8rem',
                        padding: '5px',
                        width: '70px'
                      },
                      '& .MuiButtonBase-root': {
                        padding: '3px',
                        margin: '0px'
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>
            </div>
            <h3>Chart Color</h3>
            <ColorSetting />
            <h3>Export File(.json)</h3>
            <div style={{ marginLeft: '10px' }}>
              <input
                type="text"
                value={fileName}
                
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
              />
              <button onClick={handleExport}>Export</button>
            </div>
            <h3>Import File(.json)</h3>
            <div style={{ marginLeft: '10px' }}>
              <button onClick={() => fileInputRef.current?.click()}>Import</button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} accept=".json" />
            </div>
            <h3>Column</h3>
            <ColumnSetting
              columns={columns}
              setColumns={setColumns}
              toggleColumnVisibility={toggleColumnVisibility}
            />
          </div>
          <div style={{ border: '1px solid #AAA',borderRadius: '4px', padding: '10px 10px', margin: '0px 10px'}}>
            <h3>Holidays</h3>
            <textarea
              value={holidayInput}
              onChange={(e) => setHolidayInput(e.target.value)}
              onBlur={handleBlur}
              style={{ padding: '10px', width: '200px', height: '700px', overflow: 'auto', resize: 'none' }}
            />
          </div>
        </div>
      </ModalContainer>
    </Overlay>
    : null
  );
});

export default SettingsModal;