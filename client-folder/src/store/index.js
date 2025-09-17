import { leagueReducer } from './leagueSlice';
const { configureStore } = require('@reduxjs/toolkit');

export const store = configureStore({
  reducer: {
    leagues: leagueReducer,
  },
});
