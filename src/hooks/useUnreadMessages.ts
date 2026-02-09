import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDMContext } from './useDMContext';
import { useCurrentUser } from './useCurrentUser';

const STORAGE_KEY_PREFIX = 'nostr:dm-last-read:';

interface LastReadMap {
  [pubkey: string]: number;
}

export function useUnreadMessages() {
  const { user } = useCurrentUser();
  const { messages } = useDMContext();
  const [lastRead, setLastRead] = useState<LastReadMap>({});

  // Load from localStorage on mount / user change
  useEffect(() => {
    if (!user?.pubkey) {
      setLastRead({});
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + user.pubkey);
      if (stored) setLastRead(JSON.parse(stored));
    } catch { /* ignore corrupt data */ }
  }, [user?.pubkey]);

  // Persist to localStorage
  const persistLastRead = useCallback((updated: LastReadMap) => {
    if (!user?.pubkey) return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + user.pubkey, JSON.stringify(updated));
    } catch { /* localStorage full or unavailable */ }
  }, [user?.pubkey]);

  // Mark a conversation as read (called when user selects a conversation)
  const markAsRead = useCallback((conversationPubkey: string) => {
    const now = Math.floor(Date.now() / 1000);
    setLastRead(prev => {
      const updated = { ...prev, [conversationPubkey]: now };
      persistLastRead(updated);
      return updated;
    });
  }, [persistLastRead]);

  // Mark ALL conversations as read
  const markAllAsRead = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    setLastRead(prev => {
      const updated = { ...prev };
      messages.forEach((_participant, pubkey) => {
        updated[pubkey] = now;
      });
      persistLastRead(updated);
      return updated;
    });
  }, [messages, persistLastRead]);

  // Calculate unread counts from messages state
  const unreadCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let total = 0;

    messages.forEach((participant, pubkey) => {
      const cutoff = lastRead[pubkey] || 0;
      const unread = participant.messages.filter(
        msg => msg.created_at > cutoff && msg.pubkey !== user?.pubkey
      ).length;
      if (unread > 0) {
        counts.set(pubkey, unread);
        total += unread;
      }
    });

    return { counts, total };
  }, [messages, lastRead, user?.pubkey]);

  return {
    unreadCounts: unreadCounts.counts,
    totalUnread: unreadCounts.total,
    markAsRead,
    markAllAsRead,
  };
}
