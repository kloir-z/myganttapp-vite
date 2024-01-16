// colorSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ColorInfo {
    id: number;
    alias: string;
    color: string;
  }
  
  interface ColorState {
    colors: ColorInfo[];
  }

const initialState: ColorState = {
  colors: [
    { id: 1, alias: '', color: '#70ecff51' },
    { id: 2, alias: '', color: '#70b0ff51' },
    { id: 3, alias: '', color: '#8a70ff51' },
    { id: 4, alias: '', color: '#ff70ea51' },
    { id: 5, alias: '', color: '#ff707051' },
    { id: 6, alias: '', color: '#fffe7051' },
    { id: 7, alias: '', color: '#76ff7051' }
  ],
};
const colorSlice = createSlice({
  name: 'color',
  initialState,
  reducers: {
    updateColor: (state, action: PayloadAction<{ id: number; color: string; }>) => {
        const index = state.colors.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.colors[index].color = action.payload.color;
        }
      },
      updateAlias: (state, action: PayloadAction<{ id: number; alias: string; }>) => {
        const index = state.colors.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.colors[index].alias = action.payload.alias;
        }
      },  
      updateAllColors: (state, action: PayloadAction<ColorInfo[]>) => {
        state.colors = action.payload;
      },
  },
});

export const { updateColor, updateAlias, updateAllColors } = colorSlice.actions;
export default colorSlice.reducer;