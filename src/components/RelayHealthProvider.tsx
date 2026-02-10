import { useEffect, useCallback, useRef, useState, useMemo, type ReactNode } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { RelayHealthContext, type RelayHealthContextType } from '@/contexts/RelayHealthContext';
import {
  readHealthStore,
  writeHealthStore,
  normalizeRelayUrl,
  defaultHealthData,
  type RelayHealthData,
  type RelayHealthStore,
} from '@/lib/relayHealthStore';
import { probeRelay as probeRelayFn, probeAllRelays } from '@/lib/relayProbe';
import { computeScore } from '@/lib/relayScoring';
import { fetchNip11, NIP11_STALENESS_SECONDS } from '@/lib/nip11';
import { parseNip66Events, NIP66_QUERY_INTERVAL_SECONDS, NIP66_QUERY_WINDOW_SECONDS } from '@/lib/nip66';

// ============================================================================
// Timing Constants
// ============================================================================

const PROBE_INTERVAL_MS = 5 * 60 * 1000;       // 5 min
const NIP66_INTERVAL_MS = 30 * 60 * 1000;      // 30 min
const NIP65_DEBOUNCE_MS = 30 * 1000;            // 30s
const FOCUS_IDLE_THRESHOLD_MS = 10 * 60 * 1000; // 10 min
const NIP11_TIMEOUT_MS = 5000;
const NIP66_TIMEOUT_MS = 10000;

interface RelayHealthProviderProps {
  children: ReactNode;
}

export function RelayHealthProvider({ children }: RelayHealthProviderProps) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const publish = useNostrPublish();

  // Stable refs for external dependencies
  const publishRef = useRef(publish);
  publishRef.current = publish;
  const userRef = useRef(user);
  userRef.current = user;

  // Health data — SEPARATE from relay list
  const [healthData, setHealthData] = useState<Map<string, RelayHealthData>>(new Map());
  const [isProbing, setIsProbing] = useState(false);
  const [nip66Suggestions, setNip66Suggestions] = useState<string[]>([]);

  // Mutable refs
  const healthRef = useRef<Map<string, RelayHealthData>>(new Map());
  const lastFocusTime = useRef(Date.now());
  const nip65DebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);
  const storeRef = useRef<RelayHealthStore>({
    healthData: {},
    lastNip66Query: 0,
  });

  // Track previous config.relayMetadata.updatedAt for NIP-65 publishing
  const prevUpdatedAtRef = useRef(config.relayMetadata.updatedAt);

  // ============================================================================
  // Derive relay URLs from AppContext (the SINGLE source of truth)
  // ============================================================================

  const relayUrls = useMemo(
    () => config.relayMetadata.relays.map(r => normalizeRelayUrl(r.url)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(config.relayMetadata.relays.map(r => r.url))]
  );

  // Sync healthData map when AppContext relay list changes
  useEffect(() => {
    setHealthData(prev => {
      const next = new Map(prev);
      let changed = false;

      // Add health entries for new relays
      for (const url of relayUrls) {
        if (!next.has(url)) {
          next.set(url, defaultHealthData());
          changed = true;
        }
      }

      // Remove health entries for relays no longer in list
      const urlSet = new Set(relayUrls);
      for (const url of next.keys()) {
        if (!urlSet.has(url)) {
          next.delete(url);
          changed = true;
        }
      }

      if (!changed) return prev;
      healthRef.current = next;
      return next;
    });
  }, [relayUrls]);

  // ============================================================================
  // Helpers
  // ============================================================================

  const updateHealth = useCallback((rawUrl: string, updates: Partial<RelayHealthData>) => {
    const url = normalizeRelayUrl(rawUrl);
    setHealthData(prev => {
      const existing = prev.get(url);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(url, { ...existing, ...updates });
      healthRef.current = next;
      return next;
    });
  }, []);

  const persistStore = useCallback(async (healthMap: Map<string, RelayHealthData>) => {
    const record: Record<string, RelayHealthData> = {};
    for (const [url, h] of healthMap) {
      record[url] = h;
    }
    storeRef.current.healthData = record;
    await writeHealthStore(storeRef.current);
  }, []);

  // ============================================================================
  // NIP-65 Publishing — only when user changes relay list
  // ============================================================================

  const configRelaysRef = useRef(config.relayMetadata.relays);
  configRelaysRef.current = config.relayMetadata.relays;

  useEffect(() => {
    const prevUpdatedAt = prevUpdatedAtRef.current;
    const currentUpdatedAt = config.relayMetadata.updatedAt;
    prevUpdatedAtRef.current = currentUpdatedAt;

    // Only publish if updatedAt actually changed AND it's recent (user-initiated)
    if (currentUpdatedAt <= prevUpdatedAt) return;
    if (!userRef.current) return;

    const now = Math.floor(Date.now() / 1000);
    // Only publish if the change happened within last 60 seconds (user action)
    if (now - currentUpdatedAt > 60) return;

    if (nip65DebounceTimer.current) clearTimeout(nip65DebounceTimer.current);
    nip65DebounceTimer.current = setTimeout(() => {
      const relays = configRelaysRef.current;
      const tags: string[][] = [];
      for (const relay of relays) {
        if (relay.read && relay.write) {
          tags.push(['r', relay.url]);
        } else if (relay.read) {
          tags.push(['r', relay.url, 'read']);
        } else if (relay.write) {
          tags.push(['r', relay.url, 'write']);
        }
      }
      if (tags.length > 0) {
        console.log('[RelayHealth] Publishing NIP-65 relay list:', tags);
        publishRef.current.mutate({
          kind: 10002,
          content: '',
          tags,
          created_at: Math.floor(Date.now() / 1000),
        });
      }
    }, NIP65_DEBOUNCE_MS);
  }, [config.relayMetadata.updatedAt]);

  // ============================================================================
  // Probe Operations
  // ============================================================================

  const doProbeRelay = useCallback(async (rawUrl: string) => {
    const url = normalizeRelayUrl(rawUrl);
    const controller = new AbortController();
    const result = await probeRelayFn(url, controller.signal);
    const now = Math.floor(Date.now() / 1000);

    setHealthData(prev => {
      const existing = prev.get(url);
      if (!existing) return prev;
      const next = new Map(prev);
      const updated: RelayHealthData = {
        ...existing,
        status: result.status,
        latencyMs: result.latencyMs,
        clipEventsCount: result.clipEventsCount,
        lastChecked: now,
        consecutiveFailures: result.status === 'unreachable'
          ? existing.consecutiveFailures + 1
          : 0,
      };
      updated.score = computeScore(updated);
      next.set(url, updated);
      healthRef.current = next;
      return next;
    });
  }, []);

  const doProbeAll = useCallback(async () => {
    const urls = Array.from(healthRef.current.keys());
    if (urls.length === 0) return;

    setIsProbing(true);
    console.log('[RelayHealth] Probing all relays:', urls);
    const results = await probeAllRelays(urls);
    const now = Math.floor(Date.now() / 1000);

    setHealthData(prev => {
      const next = new Map(prev);
      for (const result of results) {
        const existing = next.get(result.url);
        if (existing) {
          const updated: RelayHealthData = {
            ...existing,
            status: result.status,
            latencyMs: result.latencyMs,
            clipEventsCount: result.clipEventsCount,
            lastChecked: now,
            consecutiveFailures: result.status === 'unreachable'
              ? existing.consecutiveFailures + 1
              : 0,
          };
          updated.score = computeScore(updated);
          next.set(result.url, updated);
        }
      }
      healthRef.current = next;
      return next;
    });

    setIsProbing(false);

    // Fetch NIP-11 for stale entries
    for (const result of results) {
      if (result.status !== 'unreachable') {
        const existing = healthRef.current.get(result.url);
        if (existing && (now - existing.nip11FetchedAt > NIP11_STALENESS_SECONDS)) {
          const nip11 = await fetchNip11(result.url, AbortSignal.timeout(NIP11_TIMEOUT_MS));
          if (nip11) {
            updateHealth(result.url, { nip11, nip11FetchedAt: now });
          }
        }
      }
    }

    // Persist health data to IndexedDB
    await persistStore(healthRef.current);
  }, [updateHealth, persistStore]);

  // ============================================================================
  // NIP-66 Discovery
  // ============================================================================

  const doNip66Query = useCallback(async () => {
    const now = Math.floor(Date.now() / 1000);
    if (now - storeRef.current.lastNip66Query < NIP66_QUERY_INTERVAL_SECONDS) return;

    try {
      console.log('[RelayHealth] Querying NIP-66 relay discovery');
      const since = now - NIP66_QUERY_WINDOW_SECONDS;
      const events = await nostr.query(
        [{ kinds: [30166, 10166], since, limit: 200 }],
        { signal: AbortSignal.timeout(NIP66_TIMEOUT_MS) }
      );

      const candidates = parseNip66Events(events);
      const existingUrls = new Set(healthRef.current.keys());
      const suggestions = candidates
        .map(c => c.url)
        .filter(url => !existingUrls.has(url));

      setNip66Suggestions(suggestions);
      storeRef.current.lastNip66Query = now;

      console.log('[RelayHealth] NIP-66 suggestions:', suggestions.length);
    } catch (error) {
      console.error('[RelayHealth] NIP-66 query failed:', error);
    }
  }, [nostr]);

  // ============================================================================
  // Context Actions
  // ============================================================================

  const togglePin = useCallback((rawUrl: string) => {
    const url = normalizeRelayUrl(rawUrl);
    setHealthData(prev => {
      const existing = prev.get(url);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(url, {
        ...existing,
        isPinned: !existing.isPinned,
        source: !existing.isPinned ? 'user' : existing.source,
      });
      healthRef.current = next;
      return next;
    });
    persistStore(healthRef.current);
  }, [persistStore]);

  // ============================================================================
  // Initialization & Lifecycle
  // ============================================================================

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const stored = await readHealthStore();

      if (stored && Object.keys(stored.healthData).length > 0) {
        storeRef.current = stored;

        // Merge health metadata from IndexedDB into current health map
        setHealthData(prev => {
          const next = new Map(prev);
          for (const [rawUrl, data] of Object.entries(stored.healthData)) {
            const url = normalizeRelayUrl(rawUrl);
            if (next.has(url)) {
              // Only merge health data for relays that are in AppContext
              next.set(url, { ...data });
            }
          }
          healthRef.current = next;
          return next;
        });

        console.log('[RelayHealth] Merged health data from IndexedDB');
      }

      console.log('[RelayHealth] Initialized:', healthRef.current.size, 'relays');
      await doProbeAll();
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic probe
  useEffect(() => {
    const interval = setInterval(doProbeAll, PROBE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [doProbeAll]);

  // Periodic NIP-66 query
  useEffect(() => {
    const interval = setInterval(doNip66Query, NIP66_INTERVAL_MS);
    const timeout = setTimeout(doNip66Query, 15000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [doNip66Query]);

  // App focus re-probe
  useEffect(() => {
    const handleFocus = () => {
      const idle = Date.now() - lastFocusTime.current;
      if (idle > FOCUS_IDLE_THRESHOLD_MS) {
        console.log('[RelayHealth] App focus after', Math.round(idle / 1000), 's idle — re-probing');
        doProbeAll();
      }
      lastFocusTime.current = Date.now();
    };

    const handleBlur = () => {
      lastFocusTime.current = Date.now();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [doProbeAll]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (nip65DebounceTimer.current) clearTimeout(nip65DebounceTimer.current);
    };
  }, []);

  // Probe newly added relays when relay list changes
  useEffect(() => {
    for (const url of relayUrls) {
      const health = healthRef.current.get(url);
      if (health && health.lastChecked === 0 && health.status === 'unknown') {
        doProbeRelay(url);
        // Also fetch NIP-11
        void fetchNip11(url, AbortSignal.timeout(NIP11_TIMEOUT_MS)).then(nip11 => {
          if (nip11) {
            updateHealth(url, { nip11, nip11FetchedAt: Math.floor(Date.now() / 1000) });
          }
        });
      }
    }
  }, [relayUrls, doProbeRelay, updateHealth]);

  // ============================================================================
  // Memoized Context Value
  // ============================================================================

  const contextValue = useMemo<RelayHealthContextType>(() => ({
    healthData,
    isProbing,
    probeAll: doProbeAll,
    probeRelay: doProbeRelay,
    togglePin,
    nip66Suggestions,
  }), [healthData, isProbing, doProbeAll, doProbeRelay, togglePin, nip66Suggestions]);

  return (
    <RelayHealthContext.Provider value={contextValue}>
      {children}
    </RelayHealthContext.Provider>
  );
}
