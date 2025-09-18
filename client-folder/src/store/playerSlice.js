import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import http from '../helpers/http';
import toast from 'react-hot-toast';

const playerSlice = createSlice({
  name: 'player',
  initialState: {
    players: [],
    meta: {},
    loading: false,
    error: '',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchPlayer.pending, (state, action) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPlayer.fulfilled, (state, action) => {
      state.loading = false;
      state.players = action.payload.data;
      state.meta = action.payload.meta;
    });
    builder.addCase(fetchPlayer.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const playerReducer = playerSlice.reducer;

export const fetchPlayer = createAsyncThunk('name/player', async function fetchPlayer(params, thunkAPI) {
  try {
    const response = await http.get('/players', { params });
    return response.data;
  } catch (error) {
    toast('Failed to fetch players', { icon: '❌' });
    throw error;
  }
});