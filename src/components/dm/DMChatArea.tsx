import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { useDMContext } from '@/hooks/useDMContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { MESSAGE_PROTOCOL, type MessageProtocol } from '@/lib/dmConstants';
import { formatConversationTime, formatFullDateTime } from '@/lib/dmUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Send, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { cn, pubkeyToColor } from '@/lib/utils';
import { NoteContent } from '@/components/NoteContent';
import { MessageContent } from '@/components/dm/MessageContent';
import { DMViewSourceModal } from '@/components/dm/DMViewSourceModal';
import { useUnreadSafe } from '@/contexts/UnreadContext';
import type { NostrEvent } from '@nostrify/nostrify';

interface DMChatAreaProps {
  pubkey: string | null;
  isMobile: boolean;
  className?: string;
  onDraftsChange?: (drafts: Map<string, string>) => void;
}

// --- Message Bubble ---

const MessageBubble = memo(({
  message,
  isFromCurrentUser,
}: {
  message: {
    id: string;
    pubkey: string;
    kind: number;
    tags: string[][];
    sig: string;
    content: string;
    decryptedContent?: string;
    decryptedEvent?: NostrEvent;
    originalGiftWrapId?: string;
    error?: string;
    created_at: number;
    isSending?: boolean;
  };
  isFromCurrentUser: boolean;
}) => {
  const actualKind = message.decryptedEvent?.kind || message.kind;
  const isFileAttachment = actualKind === 15;

  const messageEvent: NostrEvent = message.decryptedEvent || {
    id: message.id,
    pubkey: message.pubkey,
    created_at: message.created_at,
    kind: message.kind,
    tags: message.tags,
    content: message.decryptedContent || '',
    sig: '',
  };

  return (
    <div className={cn('flex mb-3 sm:mb-4', isFromCurrentUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 sm:px-4',
        isFromCurrentUser ? 'bg-blue-500 text-white' : 'bg-muted'
      )}>
        {message.error ? (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <p className="text-sm italic opacity-70 cursor-help">Failed to decrypt</p>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{message.error}</p>
            </TooltipContent>
          </Tooltip>
        ) : isFileAttachment ? (
          <div className="text-sm">
            <NoteContent event={messageEvent} className="whitespace-pre-wrap break-words" />
          </div>
        ) : (
          <MessageContent
            content={message.decryptedContent || ''}
            isFromMe={isFromCurrentUser}
          />
        )}
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              'text-xs opacity-70',
              isFromCurrentUser ? 'text-white' : 'text-muted-foreground'
            )}
            title={formatFullDateTime(message.created_at)}
          >
            {formatConversationTime(message.created_at)}
          </span>
          {message.isSending ? (
            <Loader2 className="h-3 w-3 animate-spin opacity-70" />
          ) : (
            <DMViewSourceModal
              storedEvent={{
                id: message.id,
                pubkey: message.pubkey,
                created_at: message.created_at,
                kind: message.kind,
                tags: message.tags,
                content: message.content,
                sig: message.sig,
              }}
              decryptedEvent={message.decryptedEvent}
              originalGiftWrapId={message.originalGiftWrapId}
              isFromMe={isFromCurrentUser}
            />
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

// --- Chat Header (desktop only) ---

const ChatHeader = ({ pubkey }: { pubkey: string }) => {
  const navigate = useNavigate();
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;

  const displayName = metadata?.name || genUserName(pubkey);
  const avatarUrl = metadata?.picture;
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarColor = pubkeyToColor(pubkey);

  return (
    <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
      <button
        onClick={() => navigate(`/profile/${nip19.npubEncode(pubkey)}`)}
        className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback
            style={{ backgroundColor: avatarColor }}
            className="text-white font-bold text-sm"
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-semibold truncate">{displayName}</h2>
      </button>
    </div>
  );
};

// --- Auto-Growing Textarea ---

function AutoGrowTextarea({
  value,
  onChange,
  onKeyDown,
  disabled,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 160; // ~6 lines
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <Textarea
      ref={textareaRef}
      placeholder="Type a message..."
      className="!min-h-0 max-h-[160px] py-2 resize-none overflow-hidden"
      rows={1}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
    />
  );
}

// --- Main DMChatArea ---

export const DMChatArea = ({ pubkey, isMobile, className, onDraftsChange }: DMChatAreaProps) => {
  const { user } = useCurrentUser();
  const { sendMessage, isLoading } = useDMContext();
  const { messages, hasMoreMessages, loadEarlierMessages } = useConversationMessages(pubkey || '');
  const { markAsRead } = useUnreadSafe();

  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sendProtocol, setSendProtocol] = useState<MessageProtocol>(MESSAGE_PROTOCOL.NIP17);

  // Per-conversation draft storage
  const draftsRef = useRef<Map<string, string>>(new Map());

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Notify parent of draft changes (for conversation list "Draft:" preview)
  const notifyDraftsChange = useCallback(() => {
    onDraftsChange?.(new Map(draftsRef.current));
  }, [onDraftsChange]);

  // Restore draft when switching conversations
  useEffect(() => {
    if (!pubkey) return;
    const draft = draftsRef.current.get(pubkey) || '';
    setMessageText(draft);
    notifyDraftsChange();
  }, [pubkey, notifyDraftsChange]);

  // Track scroll position to determine if user is near the bottom
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [pubkey]);

  // Always scroll to bottom on conversation switch
  useEffect(() => {
    isNearBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [pubkey]);

  // Auto-scroll on new messages only if user is near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !pubkey || !user) return;

    setIsSending(true);
    try {
      await sendMessage({
        recipientPubkey: pubkey,
        content: messageText.trim(),
        protocol: sendProtocol,
      });
      setMessageText('');
      draftsRef.current.delete(pubkey);
      notifyDraftsChange();
      // Auto-mark conversation as read after sending
      markAsRead(pubkey);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [messageText, pubkey, user, sendMessage, sendProtocol, markAsRead, notifyDraftsChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Mobile: Enter always creates new line (send via button)
    // Desktop: Enter sends, Shift+Enter creates new line
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, isMobile]);

  const handleLoadMore = useCallback(async () => {
    if (!scrollAreaRef.current || isLoadingMore) return;

    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const previousScrollHeight = scrollContainer.scrollHeight;
    const previousScrollTop = scrollContainer.scrollTop;

    setIsLoadingMore(true);
    loadEarlierMessages();

    setTimeout(() => {
      if (scrollContainer) {
        const newScrollHeight = scrollContainer.scrollHeight;
        const heightDifference = newScrollHeight - previousScrollHeight;
        scrollContainer.scrollTop = previousScrollTop + heightDifference;
      }
      setIsLoadingMore(false);
    }, 0);
  }, [loadEarlierMessages, isLoadingMore]);

  // No conversation selected — show empty state
  if (!pubkey) {
    return (
      <Card className={cn('border-border bg-card h-full', className)}>
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            ) : (
              <MessageCircle className="h-12 w-12 mx-auto opacity-30" />
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className={cn('h-full flex items-center justify-center', className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Please log in to view messages</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'border-border bg-card h-full flex flex-col',
      isMobile && 'border-0 rounded-none',
      className
    )}>
      {/* Chat Header — hidden on mobile (MobileHeader shows it) */}
      {!isMobile && <ChatHeader pubkey={pubkey} />}

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="p-2 sm:p-4">
          {messages.length === 0 ? (
            <div className="h-32 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Send a message to start the conversation</p>
              </div>
            </div>
          ) : (
            <>
              {hasMoreMessages && (
                <div className="flex justify-center mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="text-xs"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load Earlier Messages'
                    )}
                  </Button>
                </div>
              )}
              {messages.map((message) => (
                <MessageBubble
                  key={message.originalGiftWrapId || message.id}
                  message={message}
                  isFromCurrentUser={message.pubkey === user.pubkey}
                />
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="px-3 py-2 sm:p-4 border-t border-border shrink-0">
        <div className="flex gap-2 items-end">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                onClick={() => setSendProtocol(prev => prev === MESSAGE_PROTOCOL.NIP17 ? MESSAGE_PROTOCOL.NIP04 : MESSAGE_PROTOCOL.NIP17)}
                disabled={isSending}
              >
                {sendProtocol === MESSAGE_PROTOCOL.NIP17 ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Lock className="h-4 w-4 text-amber-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {sendProtocol === MESSAGE_PROTOCOL.NIP17
                  ? 'NIP-17 (private, recommended)'
                  : 'NIP-04 (legacy, metadata visible)'}
              </p>
              <p className="text-xs text-muted-foreground">Click to switch</p>
            </TooltipContent>
          </Tooltip>
          <AutoGrowTextarea
            value={messageText}
            onChange={(e) => {
              const val = e.target.value;
              setMessageText(val);
              if (pubkey) {
                if (val.trim()) {
                  draftsRef.current.set(pubkey, val);
                } else {
                  draftsRef.current.delete(pubkey);
                }
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
