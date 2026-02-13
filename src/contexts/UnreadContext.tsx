import { type ReactNode } from 'react';
import { UnreadContext } from '@/contexts/UnreadContext.internal';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

export function UnreadProvider({ children }: { children: ReactNode }) {
  const unread = useUnreadMessages();
  return (
    <UnreadContext.Provider value={unread}>
      {children}
    </UnreadContext.Provider>
  );
}
