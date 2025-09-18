import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import http from '../helpers/http';
import toast from 'react-hot-toast';

const leagueSlice = createSlice({
  name: 'league',
  initialState: {
    leagues: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchLeague.pending, (state, action) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLeague.fulfilled, (state, action) => {
      state.leagues = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchLeague.rejected, (state, action) => {
      state.loading = false;
      state.error = true;
    });
  },
});

export const leagueReducer = leagueSlice.reducer;

export const fetchLeague = createAsyncThunk(
  'name/leagues',
  async function fetchLeague(params, thunkAPI) {
    try {
      const response = await http.get('/leagues');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch leagues';
      toast.error(errorMessage);
      throw error;
    }
  }
);
