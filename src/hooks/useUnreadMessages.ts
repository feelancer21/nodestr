import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDMContext } from './useDMContext';
import { useCurrentUser } from './useCurrentUser';

// Count-based unread tracking: stores the number of incoming messages
// at the time the user last opened each conversation. Unread = current
// incoming count minus stored count. Timestamps are irrelevant — any
// newly loaded message (including old ones via "Load all") counts.
const STORAGE_KEY_PREFIX = 'nostr:dm-read-counts:';

interface ReadCountMap {
  [pubkey: string]: number;
}

export function useUnreadMessages() {
  const { user } = useCurrentUser();
  const { messages } = useDMContext();
  const [readCounts, setReadCounts] = useState<ReadCountMap>({});

  // Refs for stable callbacks and synchronous access during page unload
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const userPubkeyRef = useRef(user?.pubkey);
  userPubkeyRef.current = user?.pubkey;
  const readCountsRef = useRef<ReadCountMap>({});

  // Load from localStorage on mount / user change
  useEffect(() => {
    if (!user?.pubkey) {
      setReadCounts({});
      readCountsRef.current = {};
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + user.pubkey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setReadCounts(parsed);
        readCountsRef.current = parsed;
      }
    } catch { /* ignore corrupt data */ }
  }, [user?.pubkey]);

  // Persist to localStorage
  const persistReadCounts = useCallback((updated: ReadCountMap) => {
    if (!user?.pubkey) return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + user.pubkey, JSON.stringify(updated));
    } catch { /* localStorage full or unavailable */ }
  }, [user?.pubkey]);

  // Count incoming messages for a conversation (messages from others)
  const countIncoming = useCallback((pubkey: string): number => {
    const participant = messagesRef.current.get(pubkey);
    if (!participant) return 0;
    const userPk = userPubkeyRef.current;
    return participant.messages.filter(msg => msg.pubkey !== userPk).length;
  }, []);

  // Mark a conversation as read (called when user views a conversation).
  // Writes to localStorage FIRST (synchronous) so the count is persisted
  // even during page unload when React state updates may not execute.
  const markAsRead = useCallback((conversationPubkey: string) => {
    const count = countIncoming(conversationPubkey);
    const current = readCountsRef.current;
    if (current[conversationPubkey] === count) return;
    const updated = { ...current, [conversationPubkey]: count };
    readCountsRef.current = updated;
    persistReadCounts(updated);
    setReadCounts(updated);
  }, [countIncoming, persistReadCounts]);

  // Silently persist read count for the currently viewed conversation.
  // Updates localStorage + ref but NOT React state, so badges remain visible
  // in the UI. This keeps localStorage continuously in sync while viewing,
  // making the count survive F5/page close without relying on beforeunload.
  const persistReadCountForViewed = useCallback((conversationPubkey: string) => {
    const current = readCountsRef.current;
    if (!(conversationPubkey in current)) return; // Don't silently mark "never read"
    const count = countIncoming(conversationPubkey);
    if (current[conversationPubkey] === count) return;
    const updated = { ...current, [conversationPubkey]: count };
    readCountsRef.current = updated;
    persistReadCounts(updated);
    // Intentionally NO setReadCounts — badges must stay visible
  }, [countIncoming, persistReadCounts]);

  // Mark ALL conversations as read
  const markAllAsRead = useCallback(() => {
    const updated = { ...readCountsRef.current };
    messagesRef.current.forEach((_participant, pubkey) => {
      updated[pubkey] = countIncoming(pubkey);
    });
    readCountsRef.current = updated;
    persistReadCounts(updated);
    setReadCounts(updated);
  }, [countIncoming, persistReadCounts]);

  // Calculate unread counts from messages state
  const unreadCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let total = 0;

    messages.forEach((participant, pubkey) => {
      const hasBeenRead = pubkey in readCounts;
      const currentIncoming = participant.messages.filter(
        msg => msg.pubkey !== user?.pubkey
      ).length;

      let unread: number;
      if (!hasBeenRead) {
        // Never opened this conversation: treat as unread.
        // Use actual incoming count, but at least 1 so the conversation
        // appears "new" even when only outgoing messages are loaded so far.
        unread = Math.max(currentIncoming, 1);
      } else {
        unread = Math.max(0, currentIncoming - readCounts[pubkey]);
      }

      if (unread > 0) {
        counts.set(pubkey, unread);
        total += unread;
      }
    });

    return { counts, total };
  }, [messages, readCounts, user?.pubkey]);

  return {
    unreadCounts: unreadCounts.counts,
    totalUnread: unreadCounts.total,
    markAsRead,
    markAllAsRead,
    persistReadCountForViewed,
  };
}
