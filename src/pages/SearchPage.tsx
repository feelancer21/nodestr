import { useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBanner } from '@/components/search/SearchBanner';
import { SearchResultPair } from '@/components/search/SearchResultPair';
import { useSearch, useSearchState } from '@/contexts/SearchContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useMempoolSearch } from '@/hooks/useMempoolSearch';
import { useClipAnnouncementLookup } from '@/hooks/useClipAnnouncementLookup';
import { isValidLightningPubkey, pubkeyAlias } from '@/lib/lightning';
import type { Network, OperatorInfo, MempoolNode } from '@/types/search';

function SearchResultsSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((idx) => (
        <div key={idx} className="grid grid-cols-2 gap-3">
          <Card className="border-border bg-card">
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </Card>
          <Card className="border-border bg-card">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { query, network } = useSearchState();
  const { setQuery, setNetwork, setSearchPageActive } = useSearch();
  const initializedRef = useRef(false);

  // Sync from URL params on mount (only once)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const urlQuery = searchParams.get('q') || '';
    const urlNetwork = (searchParams.get('network') as Network) || 'mainnet';

    if (urlQuery) {
      setQuery(urlQuery);
    }
    if (urlNetwork && urlNetwork !== 'mainnet') {
      setNetwork(urlNetwork);
    }
  }, [searchParams, setQuery, setNetwork]);

  // Set search page active on mount, inactive on unmount
  useEffect(() => {
    setSearchPageActive(true);
    return () => setSearchPageActive(false);
  }, [setSearchPageActive]);

  // Sync URL params when query or network changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.length >= 3) {
      params.set('q', query);
      params.set('network', network);
    }
    // Only update if different to avoid infinite loops
    const currentQ = searchParams.get('q') || '';
    const currentNetwork = searchParams.get('network') || 'mainnet';
    if (query !== currentQ || network !== currentNetwork) {
      setSearchParams(params, { replace: true });
    }
  }, [query, network, searchParams, setSearchParams]);

  useSeoMeta({
    title: query ? `Search: ${query} - nodestr` : 'Search - nodestr',
    description: 'Search for Lightning nodes on the Nostr network',
  });

  const debouncedQuery = useDebounce(query, 300);

  const { data: results = [], isLoading } = useMempoolSearch({
    query: debouncedQuery,
    network,
    enabled: debouncedQuery.length >= 3,
  });

  // Extract all Lightning pubkeys from search results
  const lightningPubkeys = useMemo(() => {
    const pubkeys = results.map((node) => node.public_key);
    // Also include the query if it's a valid Lightning pubkey (for operator lookup)
    if (isValidLightningPubkey(debouncedQuery) && !pubkeys.includes(debouncedQuery)) {
      pubkeys.push(debouncedQuery);
    }
    return pubkeys;
  }, [results, debouncedQuery]);

  // Lookup CLIP announcements for all nodes
  const { data: announcements = {} } = useClipAnnouncementLookup(lightningPubkeys);

  // Build operator map with profile data
  const operatorMap = useMemo(() => {
    const map = new Map<string, OperatorInfo>();
    for (const lnPubkey of lightningPubkeys) {
      const announcement = announcements[lnPubkey];
      map.set(lnPubkey, {
        pubkey: announcement?.nostrPubkey,
        hasAnnouncement: announcement !== null,
        lastAnnouncement: announcement?.createdAt,
      });
    }
    return map;
  }, [lightningPubkeys, announcements]);

  // Sort results: nodes with announcements first, then by capacity
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const aOperator = operatorMap.get(a.public_key);
      const bOperator = operatorMap.get(b.public_key);

      // Announced nodes first
      if (aOperator?.hasAnnouncement !== bOperator?.hasAnnouncement) {
        return aOperator?.hasAnnouncement ? -1 : 1;
      }

      // Then by capacity descending
      return b.capacity - a.capacity;
    });
  }, [results, operatorMap]);

  const hasQuery = query.length >= 3;
  const hasResults = sortedResults.length > 0;

  // Check if query is a valid Lightning pubkey (for special operator search)
  const isLnPubkey = hasQuery && isValidLightningPubkey(debouncedQuery);
  const shouldShowOperatorLink = !isLoading && hasQuery && !hasResults && isLnPubkey;

  return (
    <section className="grid gap-6">
      {/* Search Input - Only visible on mobile (<sm), tablet/desktop use header SearchBanner */}
      <div className="sm:hidden">
        <SearchBanner
          variant="page"
          placeholder="Search Lightning nodes by alias or pubkey..."
        />
      </div>

      {/* Initial State */}
      {!hasQuery && (
        <Card className="border-dashed border-border bg-card">
          <CardContent className="py-12 min-h-[200px] flex flex-col items-center justify-center text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-xs text-muted-foreground">
              Uses mempool.space API
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && hasQuery && <SearchResultsSkeleton />}

      {/* Results */}
      {!isLoading && hasQuery && hasResults && (
        <div className="grid gap-4">
          {sortedResults.map((node) => {
            const operator = operatorMap.get(node.public_key) || { hasAnnouncement: false };
            return (
              <SearchResultPair
                key={node.public_key}
                node={node}
                network={network}
                operator={operator}
              />
            );
          })}
        </div>
      )}

      {/* Empty State - Special case for Lightning pubkey */}
      {shouldShowOperatorLink && (
        <div className="grid gap-4">
          <SearchResultPair
            node={{
              public_key: debouncedQuery,
              alias: pubkeyAlias(debouncedQuery),
              capacity: 0,
              channels: 0,
              status: 1,
            } as MempoolNode}
            network={network}
            operator={operatorMap.get(debouncedQuery) || { hasAnnouncement: false }}
          />
        </div>
      )}

      {/* Empty State - Regular */}
      {!isLoading && hasQuery && !hasResults && !shouldShowOperatorLink && (
        <Card className="border-dashed border-border bg-card">
          <CardContent className="py-12 min-h-[200px] flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground">
              No nodes found for &quot;{query}&quot; on {network}.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try a different search term or network.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export default SearchPage;
