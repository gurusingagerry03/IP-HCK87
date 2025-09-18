import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import http from '../helpers/http';
import toast from 'react-hot-toast';
import { getAuthHeaders } from '../helpers/auth.jsx';

const favoriteSlice = createSlice({
  name: 'favorite',
  initialState: {
    favorites: [],
    meta: {},
    loading: false,
    error: '',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchFavorite.pending, (state, action) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFavorite.fulfilled, (state, action) => {
      state.loading = false;
      state.favorites = action.payload.data || action.payload;
      state.meta = action.payload.meta || {};
    });
    builder.addCase(fetchFavorite.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const favoriteReducer = favoriteSlice.reducer;

export const fetchFavorite = createAsyncThunk('name/favorite', async function fetchFavorite(params, thunkAPI) {
  try {
    const response = await http.get('/favorites', {
      params,
      headers: getAuthHeaders()
    });
    // Struktur response favorites: { success: true, data: [...] }
    if (response.data.success) {
      return {
        data: response.data.data || [],
        meta: response.data.meta || {}
      };
    } else {
      return { data: [], meta: {} };
    }
  } catch (error) {
    toast('Failed to fetch favorites', { icon: '❌' });
    throw error;
  }
});