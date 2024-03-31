// SettingsModal.tsx
import { useState, useEffect, memo, useCallback } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setShowYear, resetStore, setDateFormat } from '../../reduxStoreAndSlices/store';
import ColorSetting from "./ColorSetting";
import ColumnSetting from "./ColumnSetting/ColumnSetting";
import HolidaySetting from "./HolidaySetting/HolidaySetting";
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

type SettingsModalProps = {
  show: boolean;
  onClose: () => void;
};

const SettingsModal: React.FC<SettingsModalProps> = memo(({
  show, onClose
}) => {
  const dispatch = useDispatch();
  const showYear = useSelector((state: RootState) => state.wbsData.showYear);
  const currentFormat = useSelector((state: RootState) => state.wbsData.dateFormat);
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
      onClose();
    }, 210);
  }, [onClose]);

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
    handleClose();
  }, [dispatch, handleClose]);

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
    show ?
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
          <DateRangeSetting />
          <ColorSetting />
          <ColumnSetting />
          <SettingChildDiv text='Date Format'>
            <div>
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
          <SettingChildDiv text='Date Cell Format'>
            <div>
              <label>M/d</label>
              <Switch
                checked={showYear}
                onChange={handleShowYearChange}
                name="showYearSwitch"
              />
              <label>y/M/d</label>
            </div>
          </SettingChildDiv>
          <HolidaySetting />
          <RegularDaysOffSettings />
          <CellWidthSetting />
          <ExportImportFile
            handleClose={handleClose}
          />
          <SettingChildDiv text='Reset & Clear'>
            <div style={{ display: 'flex', justifyContent: 'start' }}>
              <button onClick={handleReset}>Reset & Clear</button>
            </div>
          </SettingChildDiv>
        </ModalContainer>
      </Overlay>
      : null
  );
});

export default SettingsModal;