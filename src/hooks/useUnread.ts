import { useContext } from 'react';
import { UnreadContext } from '@/contexts/UnreadContext.internal';
import type { UnreadContextType } from '@/contexts/UnreadContext.internal';

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
