import { createAsyncThunk } from '@reduxjs/toolkit';

import type { AppDispatch, RootState } from './reducer';

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

export default createAppAsyncThunk;
