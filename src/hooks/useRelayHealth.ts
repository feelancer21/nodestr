import { useContext } from 'react';
import { RelayHealthContext, type RelayHealthContextType } from '@/contexts/RelayHealthContext';

export function useRelayHealth(): RelayHealthContextType {
  const context = useContext(RelayHealthContext);
  if (!context) {
    throw new Error('useRelayHealth must be used within a RelayHealthProvider');
  }
  return context;
}
