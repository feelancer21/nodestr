import { useQuery } from '@tanstack/react-query';
import { useMempoolConfig } from './useMempoolConfig';
import { getSearchEndpoint, NETWORKS_WITH_API } from '@/lib/mempool';
import type { MempoolNode, MempoolSearchResponse } from '@/lib/mempool';
import { pubkeyAlias } from '@/lib/lightning';

interface UseNodeAliasResult {
  alias: string;
  capacity: number | null;
  channels: number | null;
  isLoading: boolean;
}

export function useNodeAlias(pubkey: string, network: string): UseNodeAliasResult {
  const { baseUrl } = useMempoolConfig();
  const hasApi = NETWORKS_WITH_API.includes(network as 'mainnet' | 'testnet' | 'signet');

  const query = useQuery({
    queryKey: ['mempool-node-alias', network, pubkey],
    queryFn: async (): Promise<{ alias: string; capacity: number | null; channels: number | null }> => {
      const url = getSearchEndpoint(baseUrl, network as 'mainnet' | 'testnet' | 'signet', pubkey);
      const response = await fetch(url);
      
      if (!response.ok) {
        return { alias: pubkeyAlias(pubkey), capacity: null, channels: null };
      }

      const data: MempoolSearchResponse = await response.json();
      const exactMatch = data.nodes.find((n: MempoolNode) => n.public_key === pubkey);

      if (exactMatch) {
        return {
          alias: exactMatch.alias || pubkeyAlias(pubkey),
          capacity: exactMatch.capacity ?? null,
          channels: exactMatch.channels ?? null,
        };
      }

      return { alias: pubkeyAlias(pubkey), capacity: null, channels: null };
    },
    enabled: hasApi && pubkey.length === 66,
    staleTime: 60_000,
    gcTime: 300_000,
  });

  if (!hasApi || !query.data) {
    return {
      alias: pubkeyAlias(pubkey),
      capacity: null,
      channels: null,
      isLoading: query.isLoading,
    };
  }

  return {
    alias: query.data.alias,
    capacity: query.data.capacity,
    channels: query.data.channels,
    isLoading: query.isLoading,
  };
}
