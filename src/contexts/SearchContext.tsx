import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { Network } from '@/types/search';

interface SearchState {
  query: string;
  network: Network;
  isSearchPageActive: boolean;
}

interface SearchActions {
  setQuery: (query: string) => void;
  setNetwork: (network: Network) => void;
  setSearchPageActive: (active: boolean) => void;
  reset: () => void;
}

interface SearchContextType extends SearchState, SearchActions {}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const DEFAULT_STATE: SearchState = {
  query: '',
  network: 'mainnet',
  isSearchPageActive: false,
};

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [state, setState] = useState<SearchState>(DEFAULT_STATE);

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  const setNetwork = useCallback((network: Network) => {
    setState((prev) => ({ ...prev, network }));
  }, []);

  const setSearchPageActive = useCallback((active: boolean) => {
    setState((prev) => ({ ...prev, isSearchPageActive: active }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setQuery,
      setNetwork,
      setSearchPageActive,
      reset,
    }),
    [state, setQuery, setNetwork, setSearchPageActive, reset]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

/**
 * Hook for accessing search actions (setQuery, setNetwork, etc.)
 */
export function useSearch(): SearchActions {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return {
    setQuery: context.setQuery,
    setNetwork: context.setNetwork,
    setSearchPageActive: context.setSearchPageActive,
    reset: context.reset,
  };
}

/**
 * Hook for accessing readonly search state
 */
export function useSearchState(): SearchState {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchState must be used within a SearchProvider');
  }
  return {
    query: context.query,
    network: context.network,
    isSearchPageActive: context.isSearchPageActive,
  };
}
