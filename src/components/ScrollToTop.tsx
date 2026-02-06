import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSearch } from '@/contexts/SearchContext';

export function ScrollToTop() {
  const { pathname } = useLocation();
  const { setQuery } = useSearch();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Reset search query on route change, except when navigating to /search
    if (pathname !== '/search') {
      setQuery('');
    }
  }, [pathname, setQuery]);

  return null;
}