import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { QuickSearchInput } from './QuickSearchInput';
import { QuickSearchResults } from './QuickSearchResults';
import { useDebounce } from '@/hooks/useDebounce';
import { useMempoolSearch } from '@/hooks/useMempoolSearch';
import type { Network, MempoolNode } from '@/types/search';

interface QuickSearchProps {
  className?: string;
  compact?: boolean;
}

export function QuickSearch({ className, compact = false }: QuickSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [network, setNetwork] = useState<Network>('mainnet');
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const { data: results = [], isLoading, isError } = useMempoolSearch({
    query: debouncedQuery,
    network,
    enabled: debouncedQuery.length >= 3,
    maxResults: 5,
  });

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (node: MempoolNode) => {
    setShowResults(false);
    setQuery('');
    navigate(`/lightning/${network}/node/${node.public_key}`);
  };

  const handleShowAll = () => {
    setShowResults(false);
    navigate(`/search?q=${encodeURIComponent(query)}&network=${network}`);
  };

  const handleFocus = () => {
    if (query.length >= 3) {
      setShowResults(true);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.length >= 3) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <QuickSearchInput
        value={query}
        onChange={handleQueryChange}
        network={network}
        onNetworkChange={setNetwork}
        onFocus={handleFocus}
        isLoading={isLoading}
        placeholder={compact ? 'Search...' : 'Search Lightning nodes...'}
        className={compact ? 'h-9' : undefined}
      />
      {showResults && query.length >= 3 && (
        <QuickSearchResults
          results={results}
          query={query}
          isError={isError}
          onResultClick={handleResultClick}
          onShowAll={handleShowAll}
        />
      )}
    </div>
  );
}
