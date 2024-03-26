// CustomDateCellTemplate.tsx
import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { Compatible, Cell } from "@silevis/reactgrid";
import { isAlphaNumericKey, isNavigationKey } from "@silevis/reactgrid";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/en-in';
import 'dayjs/locale/en';

export interface CustomDateCell extends Cell {
  type: 'customDate';
  text: string;
  shortDate: string;
  value: number;
}

interface CustomDatePickerProps {
  cell: Compatible<CustomDateCell>;
  onCellChanged: (cell: Compatible<CustomDateCell>, commit: boolean) => void;
}

const CustomDatePicker = memo(({ cell, onCellChanged }: CustomDatePickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs(cell.text));
  const [open, setOpen] = useState(false);
  const datePickerInputRef = useRef<HTMLInputElement>(null);
  const locale = useMemo(() => {
    const browserLocale = navigator.language;
    if (["ja", "zh", "ko", "hu"].includes(browserLocale)) {
      return 'en-ca';
    } else if (["in", "sa", "eu", "au"].includes(browserLocale)) {
      return 'en-in';
    } else {
      return 'en';
    }
  }, []);

  useEffect(() => {
    if (datePickerInputRef.current) {
      datePickerInputRef.current.focus();
    }
  }, []);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const onChange = useCallback((newDate: Dayjs | null) => {
    setSelectedDate(newDate);
    const newDateString = newDate ? newDate.format("YYYY-MM-DD") : "";
    onCellChanged({ ...cell, text: newDateString }, false);
  }, [cell, onCellChanged]);

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onKeyDown={e => {
        if (isAlphaNumericKey(e.keyCode) || (isNavigationKey(e.keyCode))) e.stopPropagation();
      }}
      className="customdatepicker"
      style={{ position: 'absolute', top: '-2px', left: '-2px' }}
    >
      <LocalizationProvider
        dateFormats={locale === 'en-ca' ? { monthAndYear: 'YYYY / MM' } : undefined}
        dateAdapter={AdapterDayjs}
        adapterLocale={locale}
      >
        <DatePicker
          inputRef={datePickerInputRef}
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          minDate={dayjs(1970 / 1 / 1)}
          value={selectedDate}
          onChange={onChange}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': {
              zIndex: '2',
              boxSizing: 'border-box',
              border: '2px solid #3579F8',
              borderRadius: '0px',
              backgroundColor: 'aliceblue',
            },
            '& .MuiInputBase-input': {
              zIndex: '9',
              height: '18px',
              padding: '2px 4px',
              width: '77px',
              fontSize: '0.73rem',
              fontFamily: 'Meiryo'
            },
            '& .MuiButtonBase-root': {
              zIndex: '9',
              padding: '0px',
              margin: '0px',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.1rem',
            },
            '& .MuiInputAdornment-root': {
              marginLeft: '0px',
            },
            '& .MuiInputBase-root': {
              paddingRight: '8px'
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
});

export default CustomDatePicker;