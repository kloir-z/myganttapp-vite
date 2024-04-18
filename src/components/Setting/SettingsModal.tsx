// SettingsModal.tsx
import { useState, useEffect, memo, useCallback } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setShowYear, resetStore, setDateFormat, setColumns } from '../../reduxStoreAndSlices/store';
import ColorSetting from "./ColorSetting";
import ColumnSetting from "./ColumnSetting/ColumnSetting";
import HolidaySetting from "./HolidaySetting";
import RegularDaysOffSettings from "./RegularDaysOffSetting";
import DateRangeSetting from "./DateRangeSetting";
import ExportImportFile from "./ExportImportFile";
import CellWidthSetting from "./CellWidthSetting";
import { Overlay, ModalContainer } from "../../styles/GanttStyles";
import { Switch } from '@mui/material';
import SettingChildDiv from "./SettingChildDiv";
import { MdOutlineDragIndicator } from "react-icons/md";
import { resetBaseSettings } from "../../reduxStoreAndSlices/baseSettingsSlice";
import { resetColor } from "../../reduxStoreAndSlices/colorSlice";
import { DateFormatType } from "../../types/DataTypes";
import { useTranslation } from "react-i18next";
import { setIsSettingsModalOpen } from "../../reduxStoreAndSlices/uiFlagSlice";
import i18n from 'i18next';

const SettingsModal: React.FC = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const showYear = useSelector((state: RootState) => state.wbsData.showYear);
  const currentFormat = useSelector((state: RootState) => state.wbsData.dateFormat);
  const isSettingsModalOpen = useSelector((state: RootState) => state.uiFlags.isSettingsModalOpen);
  const columns = useSelector((state: RootState) => state.wbsData.columns);
  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    i18n.changeLanguage(event.target.value as string);
  };
  const handleDayFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setDateFormat(event.target.value as DateFormatType));
  };
  const [fadeStatus, setFadeStatus] = useState<'in' | 'out'>('in');
  const [isDragging, setIsGridRefDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState<{ x: number, y: number }>({ x: 100, y: 50 });

  const handleShowYearChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    dispatch(setShowYear(isChecked));
  }, [dispatch]);

  const handleClose = useCallback(() => {
    setFadeStatus('out');
    setTimeout(() => {
      setFadeStatus('in');
      dispatch(setIsSettingsModalOpen(false));
    }, 210);
  }, [dispatch]);

  const startDrag = useCallback((e: React.MouseEvent) => {
    setIsGridRefDragging(true);
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y,
    });
    e.preventDefault();
  }, [modalPosition]);

  const onDrag = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;
      newX = Math.max(newX, 0);
      newY = Math.max(newY, 0);

      newX = Math.min(newX, windowWidth - 50);
      newY = Math.min(newY, windowHeight - 50);

      setModalPosition({
        x: newX,
        y: newY,
      });
    }
  }, [isDragging, dragStart]);

  const endDrag = useCallback(() => {
    setIsGridRefDragging(false);
  }, []);

  const handleReset = useCallback(() => {
    dispatch(resetStore());
    dispatch(resetBaseSettings());
    dispatch(resetColor());
    const translatedColumns = columns.map(column => ({
      ...column,
      columnName: t(column.columnName ?? ""),
    }));
    dispatch(setColumns(translatedColumns));
    handleClose();
  }, [columns, dispatch, handleClose, t]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', endDrag);
      return () => {
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', endDrag);
      };
    }
  }, [isDragging, onDrag, endDrag]);

  return (
    isSettingsModalOpen ?
      <Overlay fadeStatus={fadeStatus} onMouseDown={handleClose}>
        <ModalContainer
          fadeStatus={fadeStatus}
          onMouseDown={e => e.stopPropagation()}
          style={{
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`,
            position: 'absolute',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0px',
              padding: '5px',
              cursor: 'move',
            }}
            onMouseDown={startDrag}
          ><MdOutlineDragIndicator size={'20px'} />
          </div>
          <SettingChildDiv text={t('Language & Date Format')}>
            <div>
              <select value={i18n.language} onChange={handleLanguageChange} >
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
              <span style={{ whiteSpace: 'pre' }}>   </span>
              <select value={currentFormat} onChange={handleDayFormatChange}>
                <option value="yyyy/M/d">yyyy/M/d</option>
                <option value="yyyy/MM/dd">yyyy/MM/dd</option>
                <option value="M/d/yyyy">M/d/yyyy</option>
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="d/M/yyyy">d/M/yyyy</option>
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
              </select>
            </div>
          </SettingChildDiv>
          <DateRangeSetting />
          <RegularDaysOffSettings />
          <HolidaySetting />
          <ColorSetting />
          <CellWidthSetting />
          <SettingChildDiv text={t('Date Cell Format')}>
            <div>
              <label>{t('Short(e.g. M/d)')}</label>
              <Switch
                checked={showYear}
                onChange={handleShowYearChange}
                name="showYearSwitch"
              />
              <label>{t('Long(e.g. y/M/d)')}</label>
            </div>
          </SettingChildDiv>
          <ColumnSetting />
          <ExportImportFile
            handleClose={handleClose}
          />
          <SettingChildDiv text={t('Reset & Clear')}>
            <div style={{ display: 'flex', justifyContent: 'start' }}>
              <button onClick={handleReset}>{t('Reset & Clear')}</button>
            </div>
          </SettingChildDiv>
        </ModalContainer>
      </Overlay>
      : null
  );
});

export default SettingsModal;