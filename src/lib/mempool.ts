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
