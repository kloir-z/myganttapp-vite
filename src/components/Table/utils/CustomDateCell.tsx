// CustomDateCellTemplate.tsx
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { CellTemplate, Compatible, Uncertain, UncertainCompatible, keyCodes, Cell } from "@silevis/reactgrid";
import { isAlphaNumericKey, isNavigationKey } from "@silevis/reactgrid";
import { standardizeLongDateFormat, standardizeShortDateFormat } from "./wbsHelpers";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/en-in';
import 'dayjs/locale/en';

interface CustomDatePickerProps {
  cell: Compatible<CustomDateCell>;
  onCellChanged: (cell: Compatible<CustomDateCell>, commit: boolean) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
function CustomDatePicker({ cell, onCellChanged }: CustomDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs(cell.text));
  const [open, setOpen] = useState(false);
  const datePickerInputRef = useRef<HTMLInputElement>(null);
  const browserLocale = navigator.language;
  let locale;
  if (["ja", "zh", "ko", "hu"].includes(browserLocale)) {
    locale = 'en-ca';
  } else if (["in", "sa", "eu", "au"].includes(browserLocale)) {
    locale = 'en-in';
  } else {
    locale = 'en';
  }

  useEffect(() => {
    if (datePickerInputRef.current) {
      datePickerInputRef.current.focus();
    }
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onKeyDown={e => {
        if (isAlphaNumericKey(e.keyCode) || (isNavigationKey(e.keyCode))) e.stopPropagation();
      }}
      className="customdatepicker"
      style={{position: 'absolute',top: '-2px', left: '-2px'}}
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
          value={selectedDate}
          onChange={(newDate) => {
            setSelectedDate(newDate);
            const newDateString = newDate ? newDate.format("YYYY-MM-DD") : "";
            onCellChanged({ ...cell, text: newDateString }, false);
          }}
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
              height:'18px',
              fontSize: '0.8rem',
              padding: '2px 4px',
              width: '70px',
            },
            '& .MuiButtonBase-root': {
              zIndex: '9',
              padding: '0px',
              margin: '0px',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1rem',
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
}

export interface CustomDateCell extends Cell {
  type: 'customDate';
  text: string;
  shortDate: string; 
  value: number;
}

export class CustomDateCellTemplate implements CellTemplate<CustomDateCell> {
  showYear: boolean;
  constructor(showYear: boolean) {
    this.showYear = showYear;
  }
  getCompatibleCell(uncertainCell: Uncertain<CustomDateCell>): Compatible<CustomDateCell> {
    let text = uncertainCell.text || '';
    let shortDate = ''
    text = standardizeLongDateFormat(text) || '';
    shortDate = standardizeShortDateFormat(text) || '';
    const value = NaN;
    return { ...uncertainCell, text, shortDate, value };
  }

  handleKeyDown(
    cell: Compatible<CustomDateCell>,
    keyCode: number
  ): { cell: Compatible<CustomDateCell>; enableEditMode: boolean } {
    if (keyCode === keyCodes.F2 || keyCode === keyCodes.POINTER) {
      return { cell, enableEditMode: true };
    }
    return { cell, enableEditMode: false };
  }

  update(cell: Compatible<CustomDateCell>, cellToMerge: UncertainCompatible<CustomDateCell>): Compatible<CustomDateCell> {
    return this.getCompatibleCell({ ...cell, text: cellToMerge.text });
  }

  render(
    cell: Compatible<CustomDateCell>,
    isInEditMode: boolean,
    onCellChanged: (cell: Compatible<CustomDateCell>, commit: boolean) => void
  ): React.ReactNode {
    if (isInEditMode) {
      return (
        <CustomDatePicker
          cell={cell}
          onCellChanged={(updatedCell, commit) => {
            onCellChanged(updatedCell, commit);
          }}
        />
      );
    }
    return <span>{this.showYear ? cell.text : cell.shortDate}</span>;
  }  
}