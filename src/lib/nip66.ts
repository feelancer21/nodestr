import type { NostrEvent } from '@nostrify/nostrify';
import { normalizeRelayUrl } from '@/lib/relayHealthStore';

// ============================================================================
// NIP-66 Relay Discovery — Parse relay metadata and monitor events
// ============================================================================

export interface Nip66RelayCandidate {
  url: string;
  supportedKinds?: number[];
}

/**
 * Parse NIP-66 events (kind 30166 relay metadata, kind 10166 monitor announcements)
 * to extract relay candidates.
 *
 * Filters out relays that explicitly list kind 38171 (CLIP) as blocked.
 */
export function parseNip66Events(events: NostrEvent[]): Nip66RelayCandidate[] {
  const candidates = new Map<string, Nip66RelayCandidate>();

  for (const event of events) {
    if (event.kind === 30166) {
      // Relay metadata event — d-tag contains the relay URL
      const dTag = event.tags.find(([t]) => t === 'd');
      if (!dTag || !dTag[1]) continue;

      const url = normalizeNip66Url(dTag[1]);
      if (!url) continue;

      // Check for supported/blocked kinds in tags
      const supportedKinds = extractSupportedKinds(event);
      const blockedKinds = extractBlockedKinds(event);

      // Skip relays that explicitly block CLIP events (kind 38171)
      if (blockedKinds.includes(38171)) continue;

      candidates.set(url, { url, supportedKinds: supportedKinds.length > 0 ? supportedKinds : undefined });
    } else if (event.kind === 10166) {
      // Monitor announcement — extract relay URLs from r-tags
      for (const tag of event.tags) {
        if (tag[0] === 'r') {
          const url = normalizeNip66Url(tag[1]);
          if (url && !candidates.has(url)) {
            candidates.set(url, { url });
          }
        }
      }
    }
  }

  return Array.from(candidates.values());
}

function normalizeNip66Url(raw: string): string | null {
  if (!raw) return null;
  const normalized = normalizeRelayUrl(raw);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (url.protocol !== 'wss:' && url.protocol !== 'ws:') return null;
    return normalized;
  } catch {
    return null;
  }
}

function extractSupportedKinds(event: NostrEvent): number[] {
  const kinds: number[] = [];
  for (const tag of event.tags) {
    if (tag[0] === 'k') {
      const k = parseInt(tag[1], 10);
      if (!isNaN(k)) kinds.push(k);
    }
  }
  return kinds;
}

function extractBlockedKinds(event: NostrEvent): number[] {
  const kinds: number[] = [];
  for (const tag of event.tags) {
    if (tag[0] === 'blocked_kind' || tag[0] === 'K') {
      const k = parseInt(tag[1], 10);
      if (!isNaN(k)) kinds.push(k);
    }
  }
  return kinds;
}

/** NIP-66 query interval: 30 minutes */
export const NIP66_QUERY_INTERVAL_SECONDS = 30 * 60;

/** NIP-66 query time window: 7 days */
export const NIP66_QUERY_WINDOW_SECONDS = 7 * 24 * 60 * 60;
