// CustomDateCellTemplate.tsx
import CustomDatePicker from "./CustomDatePicker";
import { CellTemplate, Compatible, Uncertain, UncertainCompatible, keyCodes, Cell } from "@silevis/reactgrid";
import { standardizeLongDateFormat, standardizeShortDateFormat } from "./wbsHelpers";
import 'dayjs/locale/en-ca';
import 'dayjs/locale/en-in';
import 'dayjs/locale/en';

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