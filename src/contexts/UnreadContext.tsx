import { createContext, useContext, type ReactNode } from 'react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface UnreadContextType {
  unreadCounts: Map<string, number>;
  totalUnread: number;
  markAsRead: (pubkey: string) => void;
  markAllAsRead: () => void;
}

const UnreadContext = createContext<UnreadContextType | null>(null);

export function UnreadProvider({ children }: { children: ReactNode }) {
  const unread = useUnreadMessages();
  return (
    <UnreadContext.Provider value={unread}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread(): UnreadContextType {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error('useUnread must be used within UnreadProvider');
  return ctx;
}

/**
 * Safe version for components that may render outside UnreadProvider
 * (e.g., during initial mount before providers are ready).
 * Returns zero unread counts instead of throwing.
 */
export function useUnreadSafe(): UnreadContextType {
  const ctx = useContext(UnreadContext);
  if (!ctx) {
    return {
      totalUnread: 0,
      unreadCounts: new Map(),
      markAsRead: () => {},
      markAllAsRead: () => {},
    };
  }
  return ctx;
}
