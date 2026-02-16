import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDMContext } from "@/hooks/useDMContext";

const MESSAGES_PER_PAGE = 25;
const DISPLAY_TARGET = 50;
// NIP-17 loads gift wraps globally (can't filter per partner). A single batch
// may contain nothing for the current conversation even though older batches do.
// Require multiple consecutive empty loads before marking conversation exhausted.
const EMPTY_ROUNDS_TO_EXHAUST = 2;

export function useConversationMessages(conversationId: string) {
  const {
    messages: allMessages,
    loadConversationFromRelay,
    getConversationMeta,
    hasReachedNip17RelayEnd,
    hasLoadedFullHistory,
  } = useDMContext();
  const [visibleCount, setVisibleCount] = useState(MESSAGES_PER_PAGE);
  const [relayExhaustedForConversation, setRelayExhaustedForConversation] = useState(false);

  // Track count before relay load to detect if THIS conversation got new messages
  const countBeforeLoadRef = useRef(0);
  // Track loading state transitions
  const wasLoadingRef = useRef(false);
  // Guard against concurrent auto-load triggers
  const isAutoLoadingRef = useRef(false);
  // Count consecutive empty relay loads for this conversation
  const emptyRoundsRef = useRef(0);

  const conversationData = allMessages.get(conversationId);
  const meta = getConversationMeta(conversationId);

  const totalCachedCount = conversationData?.messages.length ?? 0;
  const hasMoreCached = totalCachedCount > visibleCount;
  const globalRelayHasMore = !hasLoadedFullHistory && !(meta?.hasReachedNip4End && hasReachedNip17RelayEnd);
  const hasMoreOnRelay = globalRelayHasMore && !relayExhaustedForConversation;
  const isLoadingFromRelay = meta?.isLoadingFromRelay ?? false;

  // All cached messages are safe to display — DMProvider stores NIP-17 messages
  // with inner (real) timestamps and sorts chronologically. No buffer needed.
  const visibleMessages = useMemo(() => {
    if (!conversationData) return [];
    return conversationData.messages.slice(-visibleCount);
  }, [conversationData, visibleCount]);

  const loadMoreCached = useCallback(() => {
    setVisibleCount(prev => prev + MESSAGES_PER_PAGE);
  }, []);

  const loadFromRelay = useCallback(async () => {
    if (isLoadingFromRelay) return;
    countBeforeLoadRef.current = totalCachedCount;
    await loadConversationFromRelay(conversationId);
  }, [loadConversationFromRelay, conversationId, isLoadingFromRelay, totalCachedCount]);

  // Reset on conversation change
  useEffect(() => {
    setVisibleCount(MESSAGES_PER_PAGE);
    setRelayExhaustedForConversation(false);
    isAutoLoadingRef.current = false;
    emptyRoundsRef.current = 0;
  }, [conversationId]);

  // Detect relay load completion: track consecutive empty rounds.
  // NIP-17 loads globally, so one empty batch doesn't mean this conversation
  // has no more messages — older batches might still contain some.
  useEffect(() => {
    if (wasLoadingRef.current && !isLoadingFromRelay) {
      if (totalCachedCount <= countBeforeLoadRef.current) {
        emptyRoundsRef.current += 1;
        if (emptyRoundsRef.current >= EMPTY_ROUNDS_TO_EXHAUST) {
          setRelayExhaustedForConversation(true);
        }
      } else {
        // Got new messages — reset counter
        emptyRoundsRef.current = 0;
      }
    }
    wasLoadingRef.current = isLoadingFromRelay;
  }, [isLoadingFromRelay, totalCachedCount]);

  // Auto-load from relay when too few messages and relay may have more
  useEffect(() => {
    if (!conversationId) return;
    if (isLoadingFromRelay) return;
    if (isAutoLoadingRef.current) return;
    if (relayExhaustedForConversation) return;
    if (!hasMoreOnRelay) return;

    if (totalCachedCount < DISPLAY_TARGET) {
      isAutoLoadingRef.current = true;
      countBeforeLoadRef.current = totalCachedCount;
      loadConversationFromRelay(conversationId).finally(() => {
        isAutoLoadingRef.current = false;
      });
    }
  }, [conversationId, totalCachedCount, hasMoreOnRelay, isLoadingFromRelay, relayExhaustedForConversation, loadConversationFromRelay]);

  return {
    messages: visibleMessages,
    hasMoreCached,
    hasMoreOnRelay,
    isLoadingFromRelay,
    loadMoreCached,
    loadFromRelay,
    totalCachedCount,
    // Keep backward-compatible aliases for any other consumers
    hasMoreMessages: hasMoreCached,
    loadEarlierMessages: loadMoreCached,
    totalCount: totalCachedCount,
    lastMessage: conversationData?.lastMessage ?? null,
    lastActivity: conversationData?.lastActivity ?? 0,
  };
}
