// SettingsModal.tsx
import React, { useState, memo, useCallback } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setShowYear } from '../../reduxStoreAndSlices/store';
import { setCellWidth } from "../../reduxStoreAndSlices/baseSettingsSlice";
import ColorSetting from "./ColorSetting";
import ColumnSetting from "./ColumnSetting/ColumnSetting";
import HolidaySetting from "./HolidaySetting/HolidaySetting";
import ReguralHolidaySetting from "./RegularHolidaySetting";
import DateRangeSetting from "./DateRangeSetting";
import ExportImportFile from "./ExportImportFile";
import { Overlay, ModalContainer } from "../../styles/GanttStyles";
import { Switch, Slider } from '@mui/material';

type SettingsModalProps = {
  show: boolean;
  onClose: () => void;
};

const SettingsModal: React.FC<SettingsModalProps> = memo(({
  show, onClose
}) => {
  const dispatch = useDispatch();
  const [fadeStatus, setFadeStatus] = useState<'in' | 'out'>('in');
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const showYear = useSelector((state: RootState) => state.wbsData.present.showYear);
  const [sliderValue, setSliderValue] = useState(cellWidth);

  const handleShowYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    dispatch(setShowYear(isChecked));
  };

  const handleSliderChange = (_: Event, value: number | number[]) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    setSliderValue(newValue);
  };

  const applyCellWidth = () => {
    dispatch(setCellWidth(sliderValue));
  };

  const handleClose = () => {
    setFadeStatus('out');
    setTimeout(() => {
      setFadeStatus('in');
      onClose();
    }, 210);
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [modalPosition, setModalPosition] = useState<{x: number, y: number}>({x: 0, y: 0});

  const startDrag = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y,
    });
    e.preventDefault();
  }, [modalPosition]);

  const onDrag = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setModalPosition({
        x: Math.round(e.clientX - dragStart.x),
        y: Math.round(e.clientY - dragStart.y),
      });
    }
  }, [isDragging, dragStart]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
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
            height: '25px',
            cursor: 'grab',
            backgroundColor: '#00000022',
            borderBottom: '1px solid #00000044'
          }}
          onMouseDown={startDrag}
        ></div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ border: '1px solid #AAA', borderRadius: '4px', padding: '10px 10px', margin: '20px' }}>
              <h3>Chart Date Range</h3>
              <DateRangeSetting />
              <h3>Chart Color (Alias)</h3>
              <ColorSetting />
              <h3>Column (Visiblity & Name)</h3>
              <ColumnSetting />
            </div>

            <div style={{ border: '1px solid #AAA', borderRadius: '4px', padding: '10px 10px', margin: '20px' }}>
              <h3>Holidays</h3>
              <HolidaySetting />
            </div>

            <div style={{ border: '1px solid #AAA', borderRadius: '4px', padding: '10px 10px', margin: '20px' }}>
              <ExportImportFile />
              <h3>Regular Holidays</h3>
              <ReguralHolidaySetting />

              <h3>Date Cell Format</h3>
              <div style={{ marginLeft: '10px' }}>
                <label>M/d</label>
                <Switch
                  checked={showYear}
                  onChange={handleShowYearChange}
                  name="showYearSwitch"
                />
                <label>y/M/d</label>
              </div>

              <h3>Chart Cell Width</h3>
              <div style={{ marginLeft: '10px' }}>
                <Slider
                  aria-labelledby="cell-width-slider"
                  value={sliderValue}
                  onChange={handleSliderChange}
                  step={0.5}
                  marks
                  min={3}
                  max={21}
                  valueLabelDisplay="auto"
                  onChangeCommitted={applyCellWidth}
                />
              </div>
            </div>
          </div>
        </ModalContainer>
      </Overlay>
      : null
  );
});

export default SettingsModal;