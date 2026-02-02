import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { NetworkSelector } from './NetworkSelector';
import { QuickSearchItem } from './QuickSearchItem';
import { useSearch, useSearchState } from '@/contexts/SearchContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useMempoolSearch } from '@/hooks/useMempoolSearch';
import { isValidLightningPubkey } from '@/lib/lightning';
import type { MempoolNode } from '@/types/search';

interface SearchBannerProps {
  variant: 'header' | 'page';
  className?: string;
  placeholder?: string;
}

export function SearchBanner({ variant, className, placeholder }: SearchBannerProps) {
  const navigate = useNavigate();
  const { query, network, isSearchPageActive } = useSearchState();
  const { setQuery, setNetwork } = useSearch();
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const { data: results = [], isLoading, isError } = useMempoolSearch({
    query: debouncedQuery,
    network,
    enabled: debouncedQuery.length >= 3 && variant === 'header' && !isSearchPageActive,
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

  const handleOperatorLookup = () => {
    setShowResults(false);
    setQuery('');
    navigate(`/lightning/operator/${debouncedQuery}`);
  };

  const handleFocus = () => {
    if (query.length >= 3 && variant === 'header' && !isSearchPageActive) {
      setShowResults(true);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.length >= 3 && variant === 'header' && !isSearchPageActive) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const defaultPlaceholder = variant === 'page'
    ? 'Search Lightning nodes by alias or pubkey...'
    : 'Search Lightning nodes...';

  const showDropdown = variant === 'header' && showResults && query.length >= 3 && !isSearchPageActive;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'relative flex items-center w-full rounded-md border border-input bg-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          variant === 'page' && 'h-12'
        )}
      >
        <div className="flex items-center justify-center pl-3 text-muted-foreground">
          {isLoading && variant === 'header' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder ?? defaultPlaceholder}
          className={cn(
            'flex-1 h-10 px-3 py-2 text-sm bg-transparent',
            'placeholder:text-muted-foreground',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            variant === 'page' && 'h-12 text-base'
          )}
        />
        <div className="pr-2">
          <NetworkSelector
            network={network}
            onNetworkChange={setNetwork}
          />
        </div>
      </div>

      {/* Dropdown Results - only for header variant */}
      {showDropdown && (
        <DropdownResults
          results={results}
          query={query}
          debouncedQuery={debouncedQuery}
          isError={isError}
          onResultClick={handleResultClick}
          onShowAll={handleShowAll}
          onOperatorLookup={isValidLightningPubkey(debouncedQuery) ? handleOperatorLookup : undefined}
        />
      )}
    </div>
  );
}

interface DropdownResultsProps {
  results: MempoolNode[];
  query: string;
  debouncedQuery: string;
  isError: boolean;
  onResultClick: (node: MempoolNode) => void;
  onShowAll: () => void;
  onOperatorLookup?: () => void;
}

function DropdownResults({
  results,
  query,
  isError,
  onResultClick,
  onShowAll,
  onOperatorLookup,
}: DropdownResultsProps) {
  if (isError) {
    return (
      <Card className="absolute top-full left-0 right-0 mt-1 z-50 border-border bg-popover shadow-md">
        <div className="p-4 text-sm text-muted-foreground text-center">
          Search failed. Please try again.
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="absolute top-full left-0 right-0 mt-1 z-50 border-border bg-popover shadow-md">
        <div className="p-4 text-sm text-muted-foreground text-center">
          No nodes found for &apos;{query}&apos;
        </div>
        {onOperatorLookup && (
          <div className="border-t border-border px-3 py-2">
            <button
              onClick={onOperatorLookup}
              className="w-full text-sm text-link hover:underline text-center"
            >
              Search for operator with this Lightning pubkey
            </button>
          </div>
        )}
      </Card>
    );
  }

  const displayResults = results.slice(0, 5);

  return (
    <Card className="absolute top-full left-0 right-0 mt-1 z-50 border-border bg-popover shadow-md overflow-hidden">
      <div className="py-1">
        {displayResults.map((node) => (
          <QuickSearchItem
            key={node.public_key}
            node={node}
            onClick={() => onResultClick(node)}
          />
        ))}
      </div>
      {results.length > 0 && (
        <div className="border-t border-border px-3 py-2">
          <button
            onClick={onShowAll}
            className="w-full text-sm text-link hover:underline text-center"
          >
            Show all results
          </button>
        </div>
      )}
    </Card>
  );
}
