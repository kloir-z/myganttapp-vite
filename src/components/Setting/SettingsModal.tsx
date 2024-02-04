// SettingsModal.tsx
import React, { useState, useEffect, useRef, Dispatch, memo, SetStateAction } from "react";
import { Overlay, ModalContainer } from "../../styles/GanttStyles";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/en-in';
import 'dayjs/locale/en';
import { ExtendedColumn } from "../Table/hooks/useWBSData";
import ColorSetting from "./ColorSetting";
import ColumnSetting from "./ColumnSetting/ColumnSetting";
import HolidaySetting from "./HolidaySetting/HolidaySetting";
import ReguralHolidaySetting from "./RegularHolidaySetting";
import { handleImport, handleExport } from "./utils/settingHelpers";

type SettingsModalProps = {
  show: boolean;
  onClose: () => void;
  dateRange: { startDate: Date, endDate: Date };
  setDateRange: Dispatch<SetStateAction<{ startDate: Date, endDate: Date }>>;
  columns: ExtendedColumn[];
  setColumns: Dispatch<SetStateAction<ExtendedColumn[]>>;
  toggleColumnVisibility: (columnId: string | number) => void;
  wbsWidth: number;
  setWbsWidth: Dispatch<SetStateAction<number>>;
  startDate: Dayjs | null;
  setStartDate: Dispatch<SetStateAction<Dayjs | null>>;
  endDate: Dayjs | null;
  setEndDate: Dispatch<SetStateAction<Dayjs | null>>;
  holidayInput: string;
  setHolidayInput: Dispatch<SetStateAction<string>>;
  fileName: string;
  setFileName: Dispatch<SetStateAction<string>>;
};

const SettingsModal: React.FC<SettingsModalProps> = memo(({ 
  show, onClose, dateRange, setDateRange, columns, setColumns, toggleColumnVisibility, wbsWidth, setWbsWidth,
  startDate, setStartDate, endDate, setEndDate, holidayInput, setHolidayInput, fileName, setFileName
}) => {
  const dispatch = useDispatch();
  const [fadeStatus, setFadeStatus] = useState<'in' | 'out'>('in');
  const data = useSelector((state: RootState) => state.wbsData.present.data);
  const regularHolidaySetting = useSelector((state: RootState) => state.wbsData.present.regularHolidaySetting);
  const colors = useSelector((state: RootState) => state.color.colors);
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

  const handleExportClick = () => {
    handleExport(
      colors,
      fileName,
      dateRange,
      columns,
      data,
      holidayInput,
      regularHolidaySetting,
      wbsWidth,
    );
  };

  const handleImportClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(
        file,
        setDateRange,
        setColumns,
        setWbsWidth,
        dispatch,
        setFileName,
        setHolidayInput,
        setStartDate,
        setEndDate,
      );
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

      const maxEndDate = dayjs(startDate).add(3, 'year');
      if (endDate.isAfter(maxEndDate)) {
        setEndDate(maxEndDate);
      } else {
        setDateRange({ startDate: startDate.toDate(), endDate: endDate.toDate() });
      }
    }
  }, [startDate, endDate, setDateRange, setStartDate, setEndDate]);

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
            <h3>Chart Color (Alias)</h3>
            <ColorSetting />
            <h3>Column (Visiblity & Name)</h3>
            <ColumnSetting
              columns={columns}
              setColumns={setColumns}
              toggleColumnVisibility={toggleColumnVisibility}
            />
          </div>
          <div style={{ border: '1px solid #AAA',borderRadius: '4px', padding: '10px 10px', margin: '0px 10px'}}>
            <h3>Holidays</h3>
            <HolidaySetting
              holidayInput={holidayInput}
              setHolidayInput={setHolidayInput}
            />
          </div>
          <div style={{ border: '1px solid #AAA',borderRadius: '4px', padding: '10px 10px', margin: '0px 10px'}}>
            <h3>Export File(.json)</h3>
            <div style={{ marginLeft: '10px' }}>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
              />
              <button onClick={handleExportClick}>Export</button>
            </div>
            <h3>Import File(.json)</h3>
            <div style={{ marginLeft: '10px' }}>
              <button onClick={() => fileInputRef.current?.click()}>Import</button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportClick} accept=".json" />
            </div>
            <h3>Regular Holidays</h3>
            <ReguralHolidaySetting />
          </div>
        </div>
      </ModalContainer>
    </Overlay>
    : null
  );
});

export default SettingsModal;