import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { SearchContext } from '@/contexts/SearchContext.internal';
import type { SearchState } from '@/contexts/SearchContext.internal';
import type { Network } from '@/types/search';

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
