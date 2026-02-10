export interface RelayHealthInfo {
  url: string;
  status: 'connected' | 'slow' | 'unreachable' | 'unknown';
  latencyMs: number | null;
  clipEventsCount: number;
  lastChecked: number;
  isPinned: boolean;
  read: boolean;
  write: boolean;
  nip11: {
    name?: string;
    description?: string;
    software?: string;
    version?: string;
    supported_nips?: number[];
    limitation?: Record<string, unknown>;
    contact?: string;
  } | null;
}

const now = Math.floor(Date.now() / 1000);

export const DUMMY_RELAYS: RelayHealthInfo[] = [
  {
    url: 'wss://relay.damus.io/',
    status: 'connected',
    latencyMs: 42,
    clipEventsCount: 12,
    lastChecked: now,
    isPinned: true,
    read: true,
    write: true,
    nip11: {
      name: 'Damus Relay',
      description: 'A Nostr relay for the Damus community',
      software: 'nostream',
      version: '1.27.0',
      supported_nips: [1, 2, 4, 9, 11, 12, 15, 16, 20, 22, 28, 33, 40],
      contact: 'admin@damus.io',
    },
  },
  {
    url: 'wss://nos.lol/',
    status: 'connected',
    latencyMs: 78,
    clipEventsCount: 8,
    lastChecked: now,
    isPinned: true,
    read: true,
    write: true,
    nip11: {
      name: 'nos.lol',
      description: 'A fast, reliable Nostr relay',
      software: 'strfry',
      version: '1.0.1',
      supported_nips: [1, 2, 4, 9, 11, 12, 15, 16, 20, 22, 28, 33],
    },
  },
  {
    url: 'wss://relay.slow-example.com/',
    status: 'slow',
    latencyMs: 1200,
    clipEventsCount: 3,
    lastChecked: now,
    isPinned: false,
    read: true,
    write: false,
    nip11: {
      name: 'Slow Example Relay',
      description: 'A relay with high latency',
      software: 'nostr-rs-relay',
      version: '0.8.9',
      supported_nips: [1, 2, 4, 11],
    },
  },
  {
    url: 'wss://relay.offline.example/',
    status: 'unreachable',
    latencyMs: null,
    clipEventsCount: 0,
    lastChecked: now - 300,
    isPinned: true,
    read: true,
    write: true,
    nip11: null,
  },
  {
    url: 'wss://relay.noclip.example/',
    status: 'connected',
    latencyMs: 95,
    clipEventsCount: 0,
    lastChecked: now,
    isPinned: false,
    read: true,
    write: false,
    nip11: {
      name: 'No CLIP Relay',
      description: 'This relay has no CLIP events',
      software: 'strfry',
      version: '1.0.0',
      supported_nips: [1, 2, 4, 11, 15],
    },
  },
];
