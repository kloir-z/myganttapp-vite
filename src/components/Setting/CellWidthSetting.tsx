// CellWidthSetting.tsx
import { useState, memo } from "react";
import { useDispatch } from 'react-redux';
import { setCellWidth } from "../../reduxStoreAndSlices/baseSettingsSlice";
import { Slider } from '@mui/material';
import SettingChildDiv from "./SettingChildDiv";
import { store } from "../../reduxStoreAndSlices/store";
import { useTranslation } from "react-i18next";

const CellWidthSetting: React.FC = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [sliderValue, setSliderValue] = useState(store.getState().baseSettings.cellWidth);

  const handleSliderChange = (_: Event, value: number | number[]) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    setSliderValue(newValue);
  };

  const applyCellWidth = () => {
    dispatch(setCellWidth(sliderValue));
  };

  return (
    <SettingChildDiv text={t('Chart Cell Width')}>
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
    </SettingChildDiv>
  )
});

export default CellWidthSetting;