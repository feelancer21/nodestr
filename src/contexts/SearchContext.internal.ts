import { createContext } from 'react';
import type { Network } from '@/types/search';

export interface SearchState {
  query: string;
  network: Network;
  isSearchPageActive: boolean;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  setNetwork: (network: Network) => void;
  setSearchPageActive: (active: boolean) => void;
  reset: () => void;
}

export interface SearchContextType extends SearchState, SearchActions {}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);
