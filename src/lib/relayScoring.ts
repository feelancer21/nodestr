import type { RelayHealthData } from './relayHealthStore';

// ============================================================================
// Scoring Constants (exported for tooltip display)
// ============================================================================

export const SCORING = {
  /** Maximum composite score */
  MAX_SCORE: 100,

  // --- Reachability (40 pts) ---
  REACHABILITY_WEIGHT: 40,
  REACHABILITY_CONNECTED: 40,
  REACHABILITY_SLOW: 15,
  REACHABILITY_UNREACHABLE: 0,

  // --- Latency (40 pts) ---
  LATENCY_WEIGHT: 40,
  LATENCY_EXCELLENT_MS: 200,
  LATENCY_EXCELLENT_PTS: 40,
  LATENCY_GOOD_MS: 500,
  LATENCY_GOOD_PTS: 30,
  LATENCY_OK_MS: 1000,
  LATENCY_OK_PTS: 20,
  LATENCY_SLOW_MS: 2000,
  LATENCY_SLOW_PTS: 10,
  LATENCY_POOR_PTS: 5,

  // --- Reliability (20 pts) ---
  RELIABILITY_WEIGHT: 20,
  RELIABILITY_PERFECT_PTS: 20,
  RELIABILITY_ACCEPTABLE_FAILURES: 2,
  RELIABILITY_ACCEPTABLE_PTS: 10,
  RELIABILITY_POOR_PTS: 0,
} as const;

// ============================================================================
// Scoring Engine
// ============================================================================

export function computeScore(health: RelayHealthData): number {
  let score = 0;

  // Reachability (40 pts)
  if (health.status === 'connected') score += SCORING.REACHABILITY_CONNECTED;
  else if (health.status === 'slow') score += SCORING.REACHABILITY_SLOW;
  // unreachable/unknown = 0

  // Latency (40 pts)
  if (health.latencyMs != null) {
    if (health.latencyMs < SCORING.LATENCY_EXCELLENT_MS) score += SCORING.LATENCY_EXCELLENT_PTS;
    else if (health.latencyMs < SCORING.LATENCY_GOOD_MS) score += SCORING.LATENCY_GOOD_PTS;
    else if (health.latencyMs < SCORING.LATENCY_OK_MS) score += SCORING.LATENCY_OK_PTS;
    else if (health.latencyMs < SCORING.LATENCY_SLOW_MS) score += SCORING.LATENCY_SLOW_PTS;
    else score += SCORING.LATENCY_POOR_PTS;
  }

  // Reliability (20 pts)
  if (health.consecutiveFailures === 0) score += SCORING.RELIABILITY_PERFECT_PTS;
  else if (health.consecutiveFailures <= SCORING.RELIABILITY_ACCEPTABLE_FAILURES) score += SCORING.RELIABILITY_ACCEPTABLE_PTS;
  // else 0 pts

  return Math.min(score, SCORING.MAX_SCORE);
}
