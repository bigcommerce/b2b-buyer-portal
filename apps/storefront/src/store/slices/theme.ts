import { createSlice, Draft, PayloadAction } from '@reduxjs/toolkit';

export interface ThemeState {
  themeFrame: HTMLIFrameElement['contentDocument'];
}

const initialState: ThemeState = {
  themeFrame: null,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    clearThemeFrame: () => initialState,
    setThemeFrame: (state, { payload }: PayloadAction<unknown>) => {
      state.themeFrame = payload as Draft<Document>;
    },
    updateOverflowStyle: (state, { payload }: PayloadAction<string>) => {
      if (!state.themeFrame) return;

      state.themeFrame.body.style.overflow = payload;
    },
  },
});

export const { clearThemeFrame, setThemeFrame, updateOverflowStyle } = themeSlice.actions;

export default themeSlice.reducer;
