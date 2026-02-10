// ============================================================================
// Relay Probing — WebSocket health checks with CLIP event counting
// ============================================================================

export interface ProbeResult {
  url: string;
  status: 'connected' | 'slow' | 'unreachable';
  latencyMs: number | null;
  clipEventsCount: number;
}

/** Thresholds used for probe classification */
export const PROBE_THRESHOLDS = {
  /** WebSocket connection timeout (ms) */
  CONNECTION_TIMEOUT_MS: 5000,
  /** Below this latency → "connected" */
  CONNECTED_MAX_MS: 500,
  /** Above CONNECTED_MAX_MS but below this → "slow"; above → also "slow" (unreachable only on error/timeout) */
  SLOW_MAX_MS: 2000,
  /** Delay between sequential relay probes (ms) */
  STAGGER_DELAY_MS: 500,
  /** CLIP event query limit */
  CLIP_QUERY_LIMIT: 50,
} as const;

/**
 * Probe a single relay by opening a WebSocket, querying kind 38171 (CLIP),
 * measuring latency, and counting returned events.
 */
export async function probeRelay(url: string, signal: AbortSignal): Promise<ProbeResult> {
  return new Promise<ProbeResult>((resolve) => {
    const startTime = Date.now();
    let ws: WebSocket | null = null;
    let resolved = false;
    let clipCount = 0;
    let gotEose = false;

    const finish = (status: ProbeResult['status']) => {
      if (resolved) return;
      resolved = true;
      const latencyMs = status === 'unreachable' ? null : Date.now() - startTime;
      try { ws?.close(); } catch { /* ignore */ }
      resolve({ url, status, latencyMs, clipEventsCount: clipCount });
    };

    // Abort handling
    if (signal.aborted) {
      resolve({ url, status: 'unreachable', latencyMs: null, clipEventsCount: 0 });
      return;
    }
    const onAbort = () => finish('unreachable');
    signal.addEventListener('abort', onAbort, { once: true });

    // Timeout
    const timeout = setTimeout(() => finish('unreachable'), PROBE_THRESHOLDS.CONNECTION_TIMEOUT_MS);

    try {
      ws = new WebSocket(url);
    } catch {
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      resolve({ url, status: 'unreachable', latencyMs: null, clipEventsCount: 0 });
      return;
    }

    ws.onopen = () => {
      // Send REQ for CLIP events (kind 38171)
      const subId = `probe_${Date.now()}`;
      const req = JSON.stringify([
        'REQ', subId,
        { kinds: [38171], limit: PROBE_THRESHOLDS.CLIP_QUERY_LIMIT },
      ]);
      ws!.send(req);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (Array.isArray(msg)) {
          if (msg[0] === 'EVENT') {
            clipCount++;
          } else if (msg[0] === 'EOSE') {
            gotEose = true;
            clearTimeout(timeout);
            signal.removeEventListener('abort', onAbort);
            const elapsed = Date.now() - startTime;
            if (elapsed <= PROBE_THRESHOLDS.CONNECTED_MAX_MS) {
              finish('connected');
            } else {
              finish('slow');
            }
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      if (!gotEose) {
        clearTimeout(timeout);
        signal.removeEventListener('abort', onAbort);
        finish('unreachable');
      }
    };

    ws.onclose = () => {
      if (!gotEose) {
        clearTimeout(timeout);
        signal.removeEventListener('abort', onAbort);
        finish('unreachable');
      }
    };
  });
}

/**
 * Probe all relays with staggered timing (500ms between probes).
 */
export async function probeAllRelays(urls: string[]): Promise<ProbeResult[]> {
  const controller = new AbortController();
  const results: ProbeResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    if (controller.signal.aborted) break;
    const result = await probeRelay(urls[i], controller.signal);
    results.push(result);
    // Stagger: wait between probes (skip after last)
    if (i < urls.length - 1) {
      await new Promise(r => setTimeout(r, PROBE_THRESHOLDS.STAGGER_DELAY_MS));
    }
  }

  return results;
}
