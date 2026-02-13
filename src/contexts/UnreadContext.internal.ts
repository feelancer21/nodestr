import { createContext } from 'react';

export interface UnreadContextType {
  unreadCounts: Map<string, number>;
  totalUnread: number;
  markAsRead: (pubkey: string) => void;
  markAllAsRead: () => void;
}

export const UnreadContext = createContext<UnreadContextType | null>(null);
