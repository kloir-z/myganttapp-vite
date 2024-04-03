import React from 'react';
import { ChromePicker, ColorResult } from 'react-color';
import { ColorInfo } from "../../reduxStoreAndSlices/colorSlice";
import { useTranslation } from 'react-i18next';

type ColorInfoItemProps = {
  colorInfo: ColorInfo;
  handleColorClick: (id: number) => void;
  handleColorClose: (id: number) => void;
  handleAliasChange: (id: number, alias: string) => void;
  makeColorChangeHandler: (id: number) => (color: ColorResult) => void;
  displayColorPicker: boolean;
};

const ColorInfoItem: React.FC<ColorInfoItemProps> = React.memo(({ colorInfo,
  handleColorClick,
  handleColorClose,
  handleAliasChange,
  makeColorChangeHandler,
  displayColorPicker
}) => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div
        style={{
          width: '50px',
          height: '15px',
          padding: '5px',
          margin: '2px',
          background: 'white',
          borderRadius: '5px',
          position: 'relative'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: colorInfo.color,
            border: '1px solid #00000016',
            borderRadius: '2px',
            cursor: 'pointer',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          onClick={() => handleColorClick(colorInfo.id)}
        />
        {displayColorPicker && (
          <div style={{ position: 'absolute', top: '29px', left: '33px', zIndex: '9999' }}>
            <div style={{ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }} onClick={() => handleColorClose(colorInfo.id)} />
            <div onClick={(e) => e.stopPropagation()}>
              <ChromePicker
                color={colorInfo.color}
                onChange={makeColorChangeHandler(colorInfo.id)}
              />
            </div>
          </div>
        )}
      </div>
      {colorInfo.id === 999 ? (
        <span style={{ margin: 'auto 0', marginLeft: '10px' }}>{t('Actual Chart Color')}</span>
      ) : (
        <input
          type="text"
          value={colorInfo.alias}
          onChange={(e) => handleAliasChange(colorInfo.id, e.target.value)}
          style={{ height: '20px', margin: '2px' }}
        />
      )}
    </div>
  );
});

export default ColorInfoItem;
