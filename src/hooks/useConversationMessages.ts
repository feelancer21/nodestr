import { useCallback, useEffect, useMemo, useState } from "react";
import { useDMContext } from "@/hooks/useDMContext";

const MESSAGES_PER_PAGE = 25;

export function useConversationMessages(conversationId: string) {
  const { messages: allMessages, loadConversationFromRelay, getConversationMeta, hasReachedNip17RelayEnd } = useDMContext();
  const [visibleCount, setVisibleCount] = useState(MESSAGES_PER_PAGE);

  const conversationData = allMessages.get(conversationId);
  const meta = getConversationMeta(conversationId);

  const totalCachedCount = conversationData?.messages.length ?? 0;
  const hasMoreCached = totalCachedCount > visibleCount;
  const hasMoreOnRelay = !(meta?.hasReachedNip4End && hasReachedNip17RelayEnd);
  const isLoadingFromRelay = meta?.isLoadingFromRelay ?? false;

  const visibleMessages = useMemo(() => {
    if (!conversationData) return [];
    return conversationData.messages.slice(-visibleCount);
  }, [conversationData, visibleCount]);

  const loadMoreCached = useCallback(() => {
    setVisibleCount(prev => prev + MESSAGES_PER_PAGE);
  }, []);

  const loadFromRelay = useCallback(async () => {
    if (isLoadingFromRelay) return;
    await loadConversationFromRelay(conversationId);
  }, [loadConversationFromRelay, conversationId, isLoadingFromRelay]);

  // Reset visible count on conversation change
  useEffect(() => {
    setVisibleCount(MESSAGES_PER_PAGE);
  }, [conversationId]);

  // Auto-load from relay if too few messages and relay may have more
  useEffect(() => {
    if (totalCachedCount < MESSAGES_PER_PAGE && hasMoreOnRelay && !isLoadingFromRelay && conversationId) {
      loadFromRelay();
    }
  }, [conversationId, totalCachedCount, hasMoreOnRelay, isLoadingFromRelay, loadFromRelay]);

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
