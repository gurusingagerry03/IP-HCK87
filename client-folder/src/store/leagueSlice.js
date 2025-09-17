import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import http from '../helpers/http';

const leagueSlice = createSlice({
  name: 'league',
  initialState: {
    leagues: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export const fetchLeague = createAsyncThunk(
  'name/leagues',
  async function fetchLeague(params, thunkAPI) {
    try {
      const response = await http.get('/leagues');
    } catch (error) {}
  }
);

export const leagueReducer = leagueSlice.reducer;
