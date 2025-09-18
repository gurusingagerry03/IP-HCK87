import { clubReducer } from './clubSlice';
import { leagueReducer } from './leagueSlice';
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    leagues: leagueReducer,
    clubs: clubReducer,
  },
});
