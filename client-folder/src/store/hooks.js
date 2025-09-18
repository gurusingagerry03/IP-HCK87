import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchClub } from './clubSlice';
import { fetchLeague } from './leagueSlice';
import { fetchMatch } from './matchSlice';
import { fetchPlayer } from './playerSlice';
import { fetchFavorite } from './favoriteSlice';

// Standard Redux hooks for consistent usage across components

// Clubs/Teams hooks
export const useClubs = (params = {}) => {
  const dispatch = useDispatch();
  const { teams, loading, error, meta } = useSelector((state) => state.clubs);

  useEffect(() => {
    dispatch(fetchClub(params));
  }, [dispatch, JSON.stringify(params)]);

  return { teams, loading, error, meta, refetch: () => dispatch(fetchClub(params)) };
};

export const useClubsState = () => {
  return useSelector((state) => state.clubs);
};

export const useClubsDispatch = () => {
  const dispatch = useDispatch();
  return {
    fetchClubs: (params) => dispatch(fetchClub(params)),
    dispatch
  };
};

// Leagues hooks
export const useLeagues = () => {
  const dispatch = useDispatch();
  const { leagues, loading, error } = useSelector((state) => state.leagues);

  useEffect(() => {
    dispatch(fetchLeague());
  }, [dispatch]);

  return { leagues, loading, error, refetch: () => dispatch(fetchLeague()) };
};

export const useLeaguesState = () => {
  return useSelector((state) => state.leagues);
};

export const useLeaguesDispatch = () => {
  const dispatch = useDispatch();
  return {
    fetchLeagues: () => dispatch(fetchLeague()),
    dispatch
  };
};

// Matches hooks
export const useMatches = (params = {}) => {
  const dispatch = useDispatch();
  const { matches, loading, error, meta } = useSelector((state) => state.matches);

  useEffect(() => {
    dispatch(fetchMatch(params));
  }, [dispatch, JSON.stringify(params)]);

  return { matches, loading, error, meta, refetch: () => dispatch(fetchMatch(params)) };
};

export const useMatchesState = () => {
  return useSelector((state) => state.matches);
};

export const useMatchesDispatch = () => {
  const dispatch = useDispatch();
  return {
    fetchMatches: (params) => dispatch(fetchMatch(params)),
    dispatch
  };
};

// Players hooks
export const usePlayers = (params = {}) => {
  const dispatch = useDispatch();
  const { players, loading, error, meta } = useSelector((state) => state.players);

  useEffect(() => {
    dispatch(fetchPlayer(params));
  }, [dispatch, JSON.stringify(params)]);

  return { players, loading, error, meta, refetch: () => dispatch(fetchPlayer(params)) };
};

export const usePlayersState = () => {
  return useSelector((state) => state.players);
};

export const usePlayersDispatch = () => {
  const dispatch = useDispatch();
  return {
    fetchPlayers: (params) => dispatch(fetchPlayer(params)),
    dispatch
  };
};

// Favorites hooks
export const useFavorites = (params = {}) => {
  const dispatch = useDispatch();
  const { favorites, loading, error, meta } = useSelector((state) => state.favorites);

  useEffect(() => {
    dispatch(fetchFavorite(params));
  }, [dispatch, JSON.stringify(params)]);

  return { favorites, loading, error, meta, refetch: () => dispatch(fetchFavorite(params)) };
};

export const useFavoritesState = () => {
  return useSelector((state) => state.favorites);
};

export const useFavoritesDispatch = () => {
  const dispatch = useDispatch();
  return {
    fetchFavorites: (params) => dispatch(fetchFavorite(params)),
    dispatch
  };
};

// Generic selector hook for accessing any part of the store
export const useAppSelector = useSelector;
export const useAppDispatch = () => useDispatch();