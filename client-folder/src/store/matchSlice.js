import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import http from '../helpers/http';
import toast from 'react-hot-toast';

const matchSlice = createSlice({
  name: 'match',
  initialState: {
    matches: [],
    meta: {},
    loading: false,
    error: '',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMatch.pending, (state, action) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMatch.fulfilled, (state, action) => {
      state.loading = false;
      state.matches = action.payload.data;
      state.meta = action.payload.meta;
    });
    builder.addCase(fetchMatch.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const matchReducer = matchSlice.reducer;

export const fetchMatch = createAsyncThunk('name/match', async function fetchMatch(params, thunkAPI) {
  try {
    const response = await http.get('/matches', { params });
    return response.data;
  } catch (error) {
    toast('Failed to fetch matches', { icon: '❌' });
    throw error;
  }
});