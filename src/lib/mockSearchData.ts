import type { MempoolNode, Network, OperatorInfo } from '@/types/search';

export const MOCK_NODES_MAINNET: MempoolNode[] = [
  {
    public_key: '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
    alias: 'ACINQ',
    capacity: 5000000000,
    channels: 1500,
    status: 1,
  },
  {
    public_key: '024bfaf0cabe7f874fd33ebf7c6f4e5385971fc504ef3f492432e9e3ec77e1b5cf',
    alias: 'Kraken',
    capacity: 4500000000,
    channels: 800,
    status: 1,
  },
  {
    public_key: '03abf6f44c355dec0d5aa155bdbdd6e0c8fefe318eff402de65c6eb2e1be55dc3e',
    alias: 'OpenNode',
    capacity: 3000000000,
    channels: 500,
    status: 0,
  },
];

export const MOCK_NODES_SIGNET: MempoolNode[] = [
  {
    public_key: '031b272ad3565e6f27c6097c9508c0697307ad1c8e62df6a8cd0134637e57bc9f4',
    alias: 'feelancer signet',
    capacity: 5000000000,
    channels: 1500,
    status: 1,
  },
];

export const MOCK_OPERATORS: Map<string, OperatorInfo> = new Map([
  [
    '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
    {
      pubkey: 'npub1acinq123456789',
      name: 'ACINQ Team',
      picture: 'https://pbs.twimg.com/profile_images/1114624209782022144/YfJArFWq_400x400.png',
      hasAnnouncement: true,
      lastAnnouncement: 1706644800,
    },
  ],
  [
    '024bfaf0cabe7f874fd33ebf7c6f4e5385971fc504ef3f492432e9e3ec77e1b5cf',
    {
      hasAnnouncement: false,
    },
  ],
  [
    '03abf6f44c355dec0d5aa155bdbdd6e0c8fefe318eff402de65c6eb2e1be55dc3e',
    {
      hasAnnouncement: false,
    },
  ],
  [
    '031b272ad3565e6f27c6097c9508c0697307ad1c8e62df6a8cd0134637e57bc9f4',
    {
      pubkey: 'npub1feelancer123456789',
      name: 'feelancer',
      picture: undefined,
      hasAnnouncement: true,
      lastAnnouncement: 1706558400,
    },
  ],
]);

export function getMockResults(query: string, network: Network): MempoolNode[] {
  const nodes = network === 'signet' ? MOCK_NODES_SIGNET : MOCK_NODES_MAINNET;

  if (!query || query.length < 3) {
    return [];
  }

  const lowerQuery = query.toLowerCase();

  return nodes.filter(
    (node) =>
      node.alias.toLowerCase().includes(lowerQuery) ||
      node.public_key.toLowerCase().includes(lowerQuery)
  );
}

export function getMockOperator(lightningPubkey: string): OperatorInfo {
  return MOCK_OPERATORS.get(lightningPubkey) || { hasAnnouncement: false };
}
