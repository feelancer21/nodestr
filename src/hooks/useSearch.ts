import { useContext } from 'react';
import { SearchContext } from '@/contexts/SearchContext.internal';
import type { SearchActions, SearchState } from '@/contexts/SearchContext.internal';

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
