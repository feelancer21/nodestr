import { openDB, type IDBPDatabase } from 'idb';

// ============================================================================
// IndexedDB Schema
// ============================================================================

const getDBName = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'default';
  return `nostr-relay-health-${hostname}`;
};
const DB_NAME = getDBName();
const DB_VERSION = 1;
const STORE_NAME = 'health';

export interface Nip11Info {
  name?: string;
  description?: string;
  software?: string;
  version?: string;
  supported_nips?: number[];
  limitation?: Record<string, unknown>;
  contact?: string;
}

/**
 * Health-only data for a relay. Does NOT store relay list membership (url/read/write).
 * The relay list lives in AppContext/localStorage as the single source of truth.
 */
export interface RelayHealthData {
  status: 'connected' | 'slow' | 'unreachable' | 'unknown';
  latencyMs: number | null;
  clipEventsCount: number;   // info display only, not in score
  lastChecked: number;
  isPinned: boolean;
  source: 'user' | 'nip65' | 'nip66';
  score: number;
  consecutiveFailures: number;
  nip11: Nip11Info | null;
  nip11FetchedAt: number;
}

export interface RelayHealthStore {
  healthData: Record<string, RelayHealthData>;
  lastNip66Query: number;
}

export function defaultHealthData(): RelayHealthData {
  return {
    status: 'unknown',
    latencyMs: null,
    clipEventsCount: 0,
    lastChecked: 0,
    isPinned: false,
    source: 'user',
    score: 0,
    consecutiveFailures: 0,
    nip11: null,
    nip11FetchedAt: 0,
  };
}

// ============================================================================
// URL Normalization — single canonical implementation
// ============================================================================

/**
 * Normalize a relay URL for consistent Map keys.
 * - Lowercases protocol + hostname (via URL constructor)
 * - Strips trailing slash (source of duplicate keys)
 * - Prepends wss:// if no protocol given
 */
export function normalizeRelayUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  try {
    const url = new URL(trimmed);
    let normalized = url.toString();
    if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
    return normalized;
  } catch {
    try {
      const url = new URL(`wss://${trimmed}`);
      let normalized = url.toString();
      if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
      return normalized;
    } catch {
      return trimmed;
    }
  }
}

// ============================================================================
// Database Operations
// ============================================================================

async function openDatabase(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

const STORE_KEY = 'relay-health';

export async function readHealthStore(): Promise<RelayHealthStore | undefined> {
  try {
    const db = await openDatabase();
    const data = await db.get(STORE_NAME, STORE_KEY);
    if (!data) return undefined;
    return data as RelayHealthStore;
  } catch (error) {
    console.error('[RelayHealth] Error reading from IndexedDB:', error);
    return undefined;
  }
}

export async function writeHealthStore(store: RelayHealthStore): Promise<void> {
  try {
    const db = await openDatabase();
    await db.put(STORE_NAME, store, STORE_KEY);
  } catch (error) {
    console.error('[RelayHealth] Error writing to IndexedDB:', error);
  }
}

export async function clearHealthStore(): Promise<void> {
  try {
    const db = await openDatabase();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('[RelayHealth] Error clearing IndexedDB:', error);
  }
}
