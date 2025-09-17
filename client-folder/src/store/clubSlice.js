import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import http from '../helpers/http';

const clubSlice = createSlice({
  name: 'club',
  initialState: {
    teams: [],
    meta: {},
    loading: false,
    error: '',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchClub.pending, (state, action) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchClub.fulfilled, (state, action) => {
      state.loading = false;
      state.teams = action.payload.data;
      state.meta = action.payload.meta;
    });
    builder.addCase(fetchClub.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const clubReducer = clubSlice.reducer;

export const fetchClub = createAsyncThunk('name/club', async function fetchClub(params, thunkAPI) {
  console.log(params, 'params di clubSlice');

  const response = await http.get('/teams', { params });
  return response.data;
});
