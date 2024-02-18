import React, { useRef } from "react";
import { handleImport, handleExport } from "./utils/settingHelpers";
import { setFileName } from "../../reduxStoreAndSlices/baseSettingsSlice";
import { isEqual } from 'lodash';
import { RootState } from '../../reduxStoreAndSlices/store';
import { useSelector, useDispatch } from 'react-redux';
import SettingChildDiv from "./SettingChildDiv";

const ExportImportFile: React.FC = () => {
  const dispatch = useDispatch();
  const regularHolidaySetting = useSelector((state: RootState) => state.wbsData.present.regularHolidaySetting);
  const colors = useSelector((state: RootState) => state.color.colors);
  const fileName = useSelector((state: RootState) => state.baseSettings.fileName);
  const dateRange = useSelector((state: RootState) => state.baseSettings.dateRange);
  const holidayInput = useSelector((state: RootState) => state.baseSettings.holidayInput);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const showYear = useSelector((state: RootState) => state.wbsData.present.showYear);
  const data = useSelector(
    (state: RootState) => state.wbsData.present.data,
    (prevData, nextData) => isEqual(prevData, nextData)
  );
  const title = useSelector((state: RootState) => state.baseSettings.title);
  const columns = useSelector((state: RootState) => state.wbsData.present.columns);

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
      calendarWidth,
      cellWidth,
      title,
      showYear
    );
  };

  const handleImportClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(
        file,
        dispatch,
      );
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <SettingChildDiv text='Export File(.json)'>
        <div>
          <input
            type="text"
            value={fileName}
            onChange={(e) => dispatch(setFileName(e.target.value))}
            placeholder="Enter File Name"
          />
          <button onClick={handleExportClick}>Export</button>
        </div>
      </SettingChildDiv>
      <SettingChildDiv text='Import File(.json)'>
        <div style={{ display: 'flex', justifyContent: 'start' }}>
          <button onClick={() => fileInputRef.current?.click()}>Import</button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportClick} accept=".json" />
        </div>
      </SettingChildDiv>
    </>
  );
};

export default ExportImportFile;