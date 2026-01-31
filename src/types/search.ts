export type Network = 'mainnet' | 'testnet' | 'signet';

export interface MempoolNode {
  public_key: string;
  alias: string;
  capacity: number;  // in satoshis
  channels: number;
  status: number;    // 1 = online, 0 = offline
}

export interface OperatorInfo {
  pubkey?: string;
  name?: string;
  picture?: string;
  hasAnnouncement: boolean;
  lastAnnouncement?: number;  // unix timestamp
}
