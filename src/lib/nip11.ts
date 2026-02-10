import type { Nip11Info } from './relayHealthStore';

/**
 * Fetch NIP-11 relay information document.
 * Converts wss:// → https:// and ws:// → http://, then GETs with Accept: application/nostr+json.
 */
export async function fetchNip11(relayUrl: string, signal: AbortSignal): Promise<Nip11Info | null> {
  try {
    const httpUrl = relayUrl
      .replace(/^wss:\/\//, 'https://')
      .replace(/^ws:\/\//, 'http://');

    const response = await fetch(httpUrl, {
      headers: { Accept: 'application/nostr+json' },
      signal,
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || typeof data !== 'object') return null;

    const info: Nip11Info = {};
    if (typeof data.name === 'string') info.name = data.name;
    if (typeof data.description === 'string') info.description = data.description;
    if (typeof data.software === 'string') info.software = data.software;
    if (typeof data.version === 'string') info.version = data.version;
    if (Array.isArray(data.supported_nips)) {
      info.supported_nips = data.supported_nips.filter((n: unknown) => typeof n === 'number');
    }
    if (data.limitation && typeof data.limitation === 'object') {
      info.limitation = data.limitation as Record<string, unknown>;
    }
    if (typeof data.contact === 'string') info.contact = data.contact;

    return info;
  } catch {
    return null;
  }
}

/** NIP-11 staleness threshold: 24 hours */
export const NIP11_STALENESS_SECONDS = 24 * 60 * 60;
