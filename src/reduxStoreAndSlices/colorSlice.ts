// colorSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ColorInfo {
  alias: string;
  color: string;
}

export interface ColorState {
  colors: { [id: number]: ColorInfo };
}

const initialState: ColorState = {
  colors: {
    1: { alias: '', color: '#70ecff51' },
    2: { alias: '', color: '#70b0ff51' },
    3: { alias: '', color: '#8a70ff51' },
    4: { alias: '', color: '#ff70ea51' },
    5: { alias: '', color: '#ff707051' },
    6: { alias: '', color: '#fffe7051' },
    7: { alias: '', color: '#76ff7051' },
    8: { alias: '', color: '#76ff7051' },
    9: { alias: '', color: '#76ff7051' },
    10: { alias: '', color: '#76ff7051' },
    999: { alias: '', color: '#0000003d' }
  },
};

const colorSlice = createSlice({
  name: 'color',
  initialState,
  reducers: {
    updateColor: (state, action: PayloadAction<{ id: number; color: string; }>) => {
      if (state.colors[action.payload.id]) {
        state.colors[action.payload.id].color = action.payload.color;
      }
    },
    updateAlias: (state, action: PayloadAction<{ id: number; alias: string; }>) => {
      if (state.colors[action.payload.id]) {
        state.colors[action.payload.id].alias = action.payload.alias;
      }
    },
    updateEntireColorSettings: (state, action: PayloadAction<{ [id: number]: Omit<ColorInfo, 'id'> }>) => {
      state.colors = action.payload;
    },
    resetColor: (state) => {
      state.colors = initialState.colors;
    },
  },
});

export const { updateColor, updateAlias, updateEntireColorSettings, resetColor } = colorSlice.actions;
export default colorSlice.reducer;