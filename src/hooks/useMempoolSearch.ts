import { useQuery } from '@tanstack/react-query';
import { useMempoolConfig } from './useMempoolConfig';
import {
  Network,
  MempoolNode,
  MempoolSearchResponse,
  getSearchEndpoint,
  NETWORKS_WITH_API,
} from '@/lib/mempool';

interface UseMempoolSearchOptions {
  query: string;
  network: Network;
  enabled?: boolean;
  maxResults?: number;
}

export function useMempoolSearch({
  query,
  network,
  enabled = true,
  maxResults,
}: UseMempoolSearchOptions) {
  const { baseUrl } = useMempoolConfig();

  const hasApi = NETWORKS_WITH_API.includes(network);
  const minLength = query.length >= 3;

  return useQuery({
    queryKey: ['mempool-search', network, query],
    queryFn: async (): Promise<MempoolNode[]> => {
      if (!hasApi) return [];

      const url = getSearchEndpoint(baseUrl, network, query);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: MempoolSearchResponse = await response.json();

      // Sort by capacity descending
      const sorted = [...data.nodes].sort((a, b) => b.capacity - a.capacity);

      // Filter out offline nodes (status === 0)
      const online = sorted.filter(n => n.status !== 0);

      return maxResults ? online.slice(0, maxResults) : online;
    },
    enabled: enabled && minLength && hasApi,
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // 5 minutes
  });
}
