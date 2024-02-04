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
import { setDateRange, setFileName } from "../../reduxStoreAndSlices/baseSettingsSlice";
import { isEqual } from 'lodash';

type SettingsModalProps = {
  show: boolean;
  onClose: () => void;
  columns: ExtendedColumn[];
  setColumns: Dispatch<SetStateAction<ExtendedColumn[]>>;
  toggleColumnVisibility: (columnId: string | number) => void;
};

const SettingsModal: React.FC<SettingsModalProps> = memo(({ 
  show, onClose, columns, setColumns, toggleColumnVisibility
}) => {
  const dispatch = useDispatch();
  const [fadeStatus, setFadeStatus] = useState<'in' | 'out'>('in');
  const data = useSelector(
    (state: RootState) => state.wbsData.present.data,
    (prevData, nextData) => isEqual(prevData, nextData)
  );
  const regularHolidaySetting = useSelector((state: RootState) => state.wbsData.present.regularHolidaySetting);
  const colors = useSelector((state: RootState) => state.color.colors);
  const dateRange = useSelector((state: RootState) => state.baseSettings.dateRange);
  const { startDate, endDate } = useSelector((state: RootState) => state.baseSettings.dateRange);
  const fileName = useSelector((state: RootState) => state.baseSettings.fileName);
  const holidayInput = useSelector((state: RootState) => state.baseSettings.holidayInput);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const title = useSelector((state: RootState) => state.baseSettings.title);
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
      title
    );
  };

  const handleImportClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(
        file,
        setColumns,
        dispatch,
      );
    }
  };

  const isValidDateRange = (date: Dayjs) => {
    const earliestDate = dayjs('1900-01-01');
    const latestDate = dayjs('2099-12-31');
    return date.isAfter(earliestDate) && date.isBefore(latestDate);
  };

  useEffect(() => {
    // dayjsオブジェクトを生成するために、startDateとendDateをパースします。
    const startDay = dayjs(startDate);
    const endDay = dayjs(endDate);
  
    if (startDay.isValid() && endDay.isValid()) {
      if (!isValidDateRange(startDay)) {
        dispatch(setDateRange({ startDate: dayjs().format('YYYY-MM-DD'), endDate }));
        return;
      }
  
      const maxEndDate = startDay.add(3, 'year');
      if (endDay.isAfter(maxEndDate)) {
        dispatch(setDateRange({ startDate, endDate: maxEndDate.format('YYYY-MM-DD') }));
      } else {
        // startDateとendDateは既に文字列形式であるため、直接ディスパッチします。
        dispatch(setDateRange({ startDate, endDate }));
      }
    }
  }, [startDate, endDate, dispatch]);
  
  const handleStartDateChange = (date: Dayjs | null) => {
    if (!date || !isValidDateRange(date)) {
      return;
    }
  
    const formattedDate = date.format('YYYY-MM-DD');
    let newEndDate = endDate;
    if (!newEndDate || dayjs(date).isAfter(dayjs(endDate))) {
      newEndDate = date.add(7, 'day').format('YYYY-MM-DD');
    }
  
    dispatch(setDateRange({ startDate: formattedDate, endDate: newEndDate }));
  };
  
  const handleEndDateChange = (date: Dayjs | null) => {
    if (!date || !isValidDateRange(date) || dayjs(startDate).isAfter(date)) {
      return;
    }
  
    dispatch(setDateRange({ startDate, endDate: date.format('YYYY-MM-DD') }));
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
                    value={dayjs(dateRange.startDate)}
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
                    value={dayjs(dateRange.endDate)}
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
            <HolidaySetting />
          </div>
          <div style={{ border: '1px solid #AAA',borderRadius: '4px', padding: '10px 10px', margin: '0px 10px'}}>
            <h3>Export File(.json)</h3>
            <div style={{ marginLeft: '10px' }}>
              <input
                type="text"
                value={fileName}
                onChange={(e) => dispatch(setFileName(e.target.value))}
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