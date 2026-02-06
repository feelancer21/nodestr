import { useRef, useEffect, useState, useMemo } from 'react';
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
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const { data: results = [], isLoading, isError } = useMempoolSearch({
    query: debouncedQuery,
    network,
    enabled: debouncedQuery.length >= 3 && variant === 'header' && !isSearchPageActive,
    maxResults: 5,
  });

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (node: MempoolNode) => {
    setShowResults(false);
    setHighlightedIndex(-1);
    setQuery('');
    navigate(`/lightning/${network}/node/${node.public_key}`);
  };

  const handleShowAll = () => {
    setShowResults(false);
    setHighlightedIndex(-1);
    navigate(`/search?q=${encodeURIComponent(query)}&network=${network}`);
  };

  const handleFocus = () => {
    if (query.length >= 3 && variant === 'header' && !isSearchPageActive) {
      setShowResults(true);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setHighlightedIndex(-1);
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

  // For valid Lightning pubkeys with no mempool results, show a synthetic entry
  const effectiveResults = useMemo(() => {
    if (results.length === 0 && isValidLightningPubkey(debouncedQuery)) {
      return [{
        public_key: debouncedQuery,
        alias: debouncedQuery,
        capacity: null as unknown as number,
        channels: null as unknown as number,
        status: 1,
      } as MempoolNode];
    }
    return results;
  }, [results, debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    const totalItems = effectiveResults.length + (effectiveResults.length > 0 ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < effectiveResults.length) {
          handleResultClick(effectiveResults[highlightedIndex]);
        } else if (highlightedIndex === effectiveResults.length) {
          handleShowAll();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setHighlightedIndex(-1);
        break;
    }
  };

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
          onKeyDown={handleKeyDown}
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
          results={effectiveResults}
          query={query}
          isError={isError}
          onResultClick={handleResultClick}
          onShowAll={handleShowAll}
          highlightedIndex={highlightedIndex}
        />
      )}
    </div>
  );
}

interface DropdownResultsProps {
  results: MempoolNode[];
  query: string;
  isError: boolean;
  onResultClick: (node: MempoolNode) => void;
  onShowAll: () => void;
  highlightedIndex: number;
}

function DropdownResults({
  results,
  query,
  isError,
  onResultClick,
  onShowAll,
  highlightedIndex,
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
      </Card>
    );
  }

  const displayResults = results.slice(0, 5);

  return (
    <Card className="absolute top-full left-0 right-0 mt-1 z-50 border-border bg-popover shadow-md overflow-hidden">
      <div className="py-1">
        {displayResults.map((node, index) => (
          <QuickSearchItem
            key={node.public_key}
            node={node}
            onClick={() => onResultClick(node)}
            isHighlighted={index === highlightedIndex}
          />
        ))}
      </div>
      {results.length > 0 && (
        <div className="border-t border-border px-3 py-2">
          <button
            onClick={onShowAll}
            className={cn(
              "w-full text-sm text-link hover:underline text-center",
              highlightedIndex === results.length && "bg-muted"
            )}
          >
            Show all results
          </button>
        </div>
      )}
    </Card>
  );
}
