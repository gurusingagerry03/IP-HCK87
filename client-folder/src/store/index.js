import { clubReducer } from './clubSlice';
import { leagueReducer } from './leagueSlice';
import { matchReducer } from './matchSlice';
import { playerReducer } from './playerSlice';
import { favoriteReducer } from './favoriteSlice';
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    leagues: leagueReducer,
    clubs: clubReducer,
    matches: matchReducer,
    players: playerReducer,
    favorites: favoriteReducer,
  },
});
