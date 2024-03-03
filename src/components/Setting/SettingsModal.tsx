// SettingsModal.tsx
import { useState, useEffect, memo, useCallback } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setShowYear } from '../../reduxStoreAndSlices/store';
import ColorSetting from "./ColorSetting";
import ColumnSetting from "./ColumnSetting/ColumnSetting";
import HolidaySetting from "./HolidaySetting/HolidaySetting";
import ReguralHolidaySetting from "./RegularHolidaySetting";
import DateRangeSetting from "./DateRangeSetting";
import ExportImportFile from "./ExportImportFile";
import CellWidthSetting from "./CellWidthSetting";
import { Overlay, ModalContainer } from "../../styles/GanttStyles";
import { Switch } from '@mui/material';
import SettingChildDiv from "./SettingChildDiv";
import { MdOutlineDragIndicator } from "react-icons/md";

type SettingsModalProps = {
  show: boolean;
  onClose: () => void;
};

const SettingsModal: React.FC<SettingsModalProps> = memo(({
  show, onClose
}) => {
  const dispatch = useDispatch();
  const [fadeStatus, setFadeStatus] = useState<'in' | 'out'>('in');
  const showYear = useSelector((state: RootState) => state.wbsData.showYear);

  const handleShowYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    dispatch(setShowYear(isChecked));
  };

  const handleClose = () => {
    setFadeStatus('out');
    setTimeout(() => {
      setFadeStatus('in');
      onClose();
    }, 210);
  };

  const [isDragging, setIsGridRefDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState<{ x: number, y: number }>({ x: 100, y: 50 });

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
        x: Math.round(newX),
        y: Math.round(newY),
      });
    }
  }, [isDragging, dragStart.x, dragStart.y]);

  const endDrag = useCallback(() => {
    setIsGridRefDragging(false);
  }, []);

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
            transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`
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
          <ReguralHolidaySetting />
          <CellWidthSetting />
          <ExportImportFile />
        </ModalContainer>
      </Overlay>
      : null
  );
});

export default SettingsModal;