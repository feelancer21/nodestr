export type Network = 'mainnet' | 'testnet' | 'testnet4' | 'signet';

export interface MempoolNode {
  public_key: string;
  alias: string;
  capacity: number;
  channels: number;
  status: number; // 0 = offline, 1 = online
}

export interface MempoolSearchResponse {
  nodes: MempoolNode[];
  channels: unknown[];
}

export const SUPPORTED_NETWORKS: Network[] = ['mainnet', 'testnet', 'testnet4', 'signet'];

export const NETWORKS_WITH_API: Network[] = ['mainnet', 'testnet', 'signet'];

export function getSearchEndpoint(baseUrl: string, network: Network, query: string): string {
  const prefix = network === 'mainnet' ? '' : `/${network}`;
  return `${baseUrl}${prefix}/api/v1/lightning/search?searchText=${encodeURIComponent(query)}`;
}

export function getNodeUrl(baseUrl: string, network: Network, pubkey: string): string {
  const prefix = network === 'mainnet' ? '' : `/${network}`;
  return `${baseUrl}${prefix}/lightning/node/${pubkey}`;
}

export function formatCapacity(satoshis: number): string {
  const btc = satoshis / 100_000_000;
  if (btc >= 1) return `${btc.toFixed(2)} BTC`;
  const msat = satoshis / 1_000_000;
  return `${msat.toFixed(2)} M sats`;
}

export function truncatePubkey(pubkey: string, chars = 8): string {
  if (pubkey.length <= chars * 2) return pubkey;
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}

/**
 * TTL cache for mempool.space API responses.
 * Deduplicates identical requests across all hooks.
 */

const MEMPOOL_CACHE_TTL_MS = 300_000; // 300 seconds

interface MempoolCacheEntry {
  data: MempoolSearchResponse;
  fetchedAt: number;
}

const mempoolCache = new Map<string, MempoolCacheEntry>();

/**
 * Fetch from mempool.space API with TTL caching.
 * Returns cached response if available and not expired.
 * Cache key is the full URL.
 */
export async function mempoolFetch(url: string): Promise<MempoolSearchResponse> {
  const now = Date.now();

  // Return cached data if still valid
  const cached = mempoolCache.get(url);
  if (cached && (now - cached.fetchedAt) < MEMPOOL_CACHE_TTL_MS) {
    return cached.data;
  }

  // Lazy cleanup: remove expired entries
  for (const [key, entry] of mempoolCache) {
    if ((now - entry.fetchedAt) >= MEMPOOL_CACHE_TTL_MS) {
      mempoolCache.delete(key);
    }
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const data: MempoolSearchResponse = await response.json();
  mempoolCache.set(url, { data, fetchedAt: now });
  return data;
}
