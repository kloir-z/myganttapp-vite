// ColorInfoItem.tsx
import { useCallback, memo, useState, useRef, useEffect } from 'react';
import { ChromePicker, ColorResult } from 'react-color';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { updateAlias, updateColor } from '../../reduxStoreAndSlices/colorSlice';

type ColorInfoItemProps = {
  id: number;
  alias: string;
  color: string;
  handleColorClick: (id: number) => void;
  handleColorClose: (id: number) => void;
  displayColorPicker: boolean;
};

const ColorInfoItem: React.FC<ColorInfoItemProps> = memo(({
  id,
  alias,
  color,
  handleColorClick,
  handleColorClose,
  displayColorPicker
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [localAlias, setLocalAlias] = useState(alias);
  const aliasTimeoutRef = useRef<number | null>(null);

  const resetAliasTimeout = useCallback(() => {
    if (aliasTimeoutRef.current) {
      clearTimeout(aliasTimeoutRef.current);
    }
    aliasTimeoutRef.current = window.setTimeout(() => {
      dispatch(updateAlias({ id, alias: localAlias }));
    }, 100);
  }, [dispatch, id, localAlias]);

  useEffect(() => {
    resetAliasTimeout();
  }, [localAlias, resetAliasTimeout]);

  const handleColorChange = useCallback((id: number) => (color: ColorResult) => {
    const rgbaColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
    dispatch(updateColor({ id, color: rgbaColor }));
  }, [dispatch]);

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
            background: color,
            border: '1px solid #00000016',
            borderRadius: '2px',
            cursor: 'pointer',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          onClick={() => handleColorClick(id)}
        />
        {displayColorPicker && (
          <div style={{ position: 'absolute', top: '29px', left: '33px', zIndex: '9999' }}>
            <div style={{ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }} onClick={() => handleColorClose(id)} />
            <div onClick={(e) => e.stopPropagation()}>
              <ChromePicker
                color={color}
                onChange={handleColorChange(id)}
              />
            </div>
          </div>
        )}
      </div>
      {id === 999 ? (
        <span style={{ margin: 'auto 0', marginLeft: '10px' }}>{t('Actual Chart Color')}</span>
      ) : (
        <input
          type="text"
          value={localAlias}
          onChange={(e) => setLocalAlias(e.target.value)}
          style={{ height: '20px', margin: '2px' }}
        />
      )}
    </div>
  );
});

export default ColorInfoItem;