import { createContext } from 'react';

export interface UnreadContextType {
  unreadCounts: Map<string, number>;
  totalUnread: number;
  markAsRead: (pubkey: string) => void;
  markAllAsRead: () => void;
  /** Silently persist read count for the currently viewed conversation to
   *  localStorage + ref WITHOUT updating React state. This keeps localStorage
   *  in sync while preserving badge visibility. Call from the chat view
   *  whenever messages change. */
  persistReadCountForViewed: (pubkey: string) => void;
}

export const UnreadContext = createContext<UnreadContextType | null>(null);
