import React, { useRef, memo } from "react";
import { handleImport, handleExport, handleAppend } from "./utils/settingHelpers";
import { setFileName } from "../../reduxStoreAndSlices/baseSettingsSlice";
import { RootState } from '../../reduxStoreAndSlices/store';
import { useSelector, useDispatch } from 'react-redux';
import SettingChildDiv from "./SettingChildDiv";
import { useTranslation } from "react-i18next";

type ExportImportFileProps = {
  handleClose: () => void;
};

const ExportImportFile: React.FC<ExportImportFileProps> = memo(({ handleClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const regularDaysOffSetting = useSelector((state: RootState) => state.wbsData.regularDaysOffSetting);
  const colors = useSelector((state: RootState) => state.color.colors);
  const fileName = useSelector((state: RootState) => state.baseSettings.fileName);
  const dateRange = useSelector((state: RootState) => state.baseSettings.dateRange);
  const holidayInput = useSelector((state: RootState) => state.baseSettings.holidayInput);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const showYear = useSelector((state: RootState) => state.wbsData.showYear);
  const dateFormat = useSelector((state: RootState) => state.wbsData.dateFormat);
  const data = useSelector((state: RootState) => state.wbsData.data);
  const title = useSelector((state: RootState) => state.baseSettings.title);
  const columns = useSelector((state: RootState) => state.wbsData.columns);

  const handleExportClick = () => {
    handleExport(
      colors,
      fileName,
      dateRange,
      columns,
      data,
      holidayInput,
      regularDaysOffSetting,
      wbsWidth,
      calendarWidth,
      cellWidth,
      title,
      showYear,
      dateFormat
    );
  };

  const handleAppendClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAppend(
        data,
        file,
        dispatch,
      );
    }
    handleClose();
  };

  const handleImportClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(
        file,
        dispatch,
      );
    }
    handleClose();
  };

  const fileInputRefImport = useRef<HTMLInputElement>(null);
  const fileInputRefAppend = useRef<HTMLInputElement>(null);

  return (
    <>
      <SettingChildDiv text={t('Export JSON File')}>
        <div>
          <input
            type="text"
            value={fileName}
            onChange={(e) => dispatch(setFileName(e.target.value))}
            placeholder={t('Enter File Name')}
          />
          <button onClick={handleExportClick}>{t('Export')}</button>
        </div>
      </SettingChildDiv>
      <SettingChildDiv text={t('Import From JSON File')}>
        <div style={{ display: 'flex', justifyContent: 'start' }}>
          <button onClick={() => fileInputRefImport.current?.click()}>{t('Import')}</button>
          <input type="file" ref={fileInputRefImport} style={{ display: 'none' }} onChange={handleImportClick} accept=".json" />
        </div>
      </SettingChildDiv>
      <SettingChildDiv text={t('Append to Table from JSON File')}>
        <div style={{ display: 'flex', justifyContent: 'start' }}>
          <button onClick={() => fileInputRefAppend.current?.click()}>{t('Append')}</button>
          <input type="file" ref={fileInputRefAppend} style={{ display: 'none' }} onChange={handleAppendClick} accept=".json" />
        </div>
      </SettingChildDiv>
    </>
  );
});

export default ExportImportFile;