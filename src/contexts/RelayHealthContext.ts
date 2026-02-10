import { createContext } from 'react';
import type { RelayHealthData } from '@/lib/relayHealthStore';

export interface RelayHealthContextType {
  /** Health data keyed by normalized relay URL */
  healthData: Map<string, RelayHealthData>;
  /** Whether a probe cycle is running */
  isProbing: boolean;
  /** Trigger a probe of all relays */
  probeAll: () => void;
  /** Probe a single relay */
  probeRelay: (url: string) => void;
  /** Toggle pin status */
  togglePin: (url: string) => void;
  /** NIP-66 discovered relay URLs (suggestions, not yet in relay list) */
  nip66Suggestions: string[];
}

export const RelayHealthContext = createContext<RelayHealthContextType | undefined>(undefined);
