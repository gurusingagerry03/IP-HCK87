import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchClub } from './clubSlice';
import { fetchLeague } from './leagueSlice';

// Standard Redux hooks for consistent usage across components

// Clubs/Teams hooks
export const useClubs = (params = {}) => {
  const dispatch = useDispatch();
  const { teams, loading, error, meta } = useSelector((state) => state.clubs);

  useEffect(() => {
    dispatch(fetchClub(params));
  }, [dispatch]);

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

// Generic selector hook for accessing any part of the store
export const useAppSelector = useSelector;
export const useAppDispatch = () => useDispatch();