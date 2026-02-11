import { useState, useRef, useEffect, useLayoutEffect, useCallback, memo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { useDMContext } from '@/hooks/useDMContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { MESSAGE_PROTOCOL, type MessageProtocol } from '@/lib/dmConstants';
import { formatMessageTime, formatDateSeparator, formatFullDateTime, stripCodeBlocks } from '@/lib/dmUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Send, Loader2, ShieldCheck, Lock, Copy, Check, Reply, X } from 'lucide-react';
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

interface ReplyTo {
  content: string;
  pubkey: string;
  messageId: string;
}

// --- Clipboard utility (with fallback for non-HTTPS) ---

async function copyText(text: string, containerElement: HTMLElement): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* fall through */ }
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;padding:0;border:none;outline:none;box-shadow:none;background:transparent;';
  textArea.setAttribute('readonly', '');
  textArea.setAttribute('tabindex', '-1');
  textArea.setAttribute('aria-hidden', 'true');
  containerElement.appendChild(textArea);
  textArea.focus({ preventScroll: true });
  textArea.select();
  let success = false;
  try { success = document.execCommand('copy'); } catch { success = false; }
  containerElement.removeChild(textArea);
  return success;
}

// --- Message Copy Button (adapts to own vs received bubble colors) ---

function MessageCopyButton({ value, isFromMe }: { value: string; isFromMe: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const success = await copyText(value, e.currentTarget);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center transition',
        isFromMe
          ? 'text-dm-own-foreground opacity-50 hover:opacity-100'
          : 'text-muted-foreground opacity-50 hover:opacity-100'
      )}
      title={copied ? 'Copied!' : 'Copy message'}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// --- Message Bubble ---

const MessageBubble = memo(({
  message,
  isFromCurrentUser,
  onReply,
  onQuoteClick,
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
  onReply?: (data: ReplyTo) => void;
  onQuoteClick?: (quotedText: string) => void;
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
    <div
      id={`msg-${message.id}`}
      className={cn('flex mb-3 sm:mb-4 transition-colors duration-700', isFromCurrentUser ? 'justify-end' : 'justify-start')}
    >
      <div className={cn(
        'max-w-[95%] sm:max-w-[95%] rounded-lg px-3 py-2 sm:px-4',
        isFromCurrentUser ? 'bg-dm-own text-dm-own-foreground' : 'bg-muted'
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
            onQuoteClick={onQuoteClick}
          />
        )}
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              'text-xs opacity-70',
              isFromCurrentUser ? 'text-dm-own-foreground' : 'text-muted-foreground'
            )}
            title={formatFullDateTime(message.created_at)}
          >
            {formatMessageTime(message.created_at)}
          </span>
          {/* Copy message button */}
          {!message.isSending && !message.error && message.decryptedContent && (
            <MessageCopyButton
              value={message.decryptedContent}
              isFromMe={isFromCurrentUser}
            />
          )}
          {/* Reply button (received messages only) */}
          {!isFromCurrentUser && !message.isSending && !message.error && message.decryptedContent && (
            <button
              onClick={() => onReply?.({
                content: message.decryptedContent!,
                pubkey: message.pubkey,
                messageId: message.id,
              })}
              className="inline-flex items-center transition text-muted-foreground opacity-50 hover:opacity-100"
              title="Reply"
            >
              <Reply className="h-3 w-3" />
            </button>
          )}
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

// --- Date Separator Badge ---

function DateSeparator({ timestamp }: { timestamp: number }) {
  return (
    <div className="flex justify-center my-4">
      <span className="text-xs text-white bg-muted-foreground/60 rounded-full px-3 py-0.5">
        {formatDateSeparator(timestamp)}
      </span>
    </div>
  );
}

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
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  // Per-conversation draft storage
  const draftsRef = useRef<Map<string, string>>(new Map());

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Helper: get the Radix ScrollArea viewport element
  const getViewport = useCallback(() => {
    return scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
  }, []);

  // Notify parent of draft changes (for conversation list "Draft:" preview)
  const notifyDraftsChange = useCallback(() => {
    onDraftsChange?.(new Map(draftsRef.current));
  }, [onDraftsChange]);

  // Restore draft when switching conversations; clear reply state
  useEffect(() => {
    if (!pubkey) return;
    const draft = draftsRef.current.get(pubkey) || '';
    setMessageText(draft);
    setReplyTo(null);
    notifyDraftsChange();
  }, [pubkey, notifyDraftsChange]);

  // Track scroll position to know if user is near the bottom
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [pubkey, getViewport]);

  // PRIMARY auto-scroll: useLayoutEffect fires synchronously after React commits DOM changes
  // but BEFORE the browser paints or fires scroll events — so isNearBottomRef is still accurate.
  useLayoutEffect(() => {
    if (!isNearBottomRef.current) return;
    const viewport = getViewport();
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, getViewport]);

  // Always scroll to bottom on conversation switch
  useLayoutEffect(() => {
    if (!pubkey) return;
    isNearBottomRef.current = true;
    const viewport = getViewport();
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [pubkey, getViewport]);

  // BACKUP: ResizeObserver for async content changes (e.g. images loading after render)
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;
    const content = viewport.firstElementChild as HTMLElement | null;
    if (!content) return;

    let prevScrollHeight = viewport.scrollHeight;
    const resizeObserver = new ResizeObserver(() => {
      const newScrollHeight = viewport.scrollHeight;
      if (newScrollHeight === prevScrollHeight) return;
      if (isNearBottomRef.current) {
        viewport.scrollTop = newScrollHeight;
      }
      prevScrollHeight = newScrollHeight;
    });

    resizeObserver.observe(content);
    return () => resizeObserver.disconnect();
  }, [pubkey, getViewport]);

  // Mark conversation as read when opening (with delay to avoid transient URL states)
  useEffect(() => {
    if (!pubkey) return;

    const timer = setTimeout(() => {
      markAsRead(pubkey);
    }, 500);

    return () => clearTimeout(timer);
  }, [pubkey, markAsRead]);

  // Scroll to a specific message by ID (for reply preview link)
  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Brief highlight flash
    element.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
    setTimeout(() => { element.style.backgroundColor = ''; }, 1500);
  }, []);

  // Find the original message by matching its content against the quoted text, then scroll to it
  const findAndScrollToOriginal = useCallback((quotedText: string) => {
    if (!quotedText) return;
    const match = messages.find(m =>
      m.decryptedContent && m.decryptedContent.startsWith(quotedText.slice(0, 80))
    );
    if (match) scrollToMessage(match.id);
  }, [messages, scrollToMessage]);

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !pubkey || !user) return;

    // Prepend blockquote if replying (max 2 lines of the original)
    const replyPrefix = replyTo
      ? `> ${replyTo.content.split('\n').slice(0, 2).join('\n> ')}\n\n`
      : '';
    const fullMessage = replyPrefix + messageText.trim();

    setIsSending(true);
    try {
      await sendMessage({
        recipientPubkey: pubkey,
        content: fullMessage,
        protocol: sendProtocol,
      });
      setMessageText('');
      setReplyTo(null);
      draftsRef.current.delete(pubkey);
      notifyDraftsChange();
      // Auto-mark conversation as read after sending
      markAsRead(pubkey);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [messageText, pubkey, user, sendMessage, sendProtocol, replyTo, markAsRead, notifyDraftsChange]);

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

  const handleReply = useCallback((data: ReplyTo) => {
    setReplyTo(data);
  }, []);

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

  // Truncate reply preview to ~2 lines worth of text
  const replyPreviewText = replyTo
    ? stripCodeBlocks(replyTo.content.split('\n').slice(0, 2).join('\n').slice(0, 200))
    : '';

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
              {messages.map((message, index) => {
                const showDateSep = index === 0 || (
                  new Date(messages[index - 1].created_at * 1000).toDateString() !==
                  new Date(message.created_at * 1000).toDateString()
                );
                return (
                  <Fragment key={message.originalGiftWrapId || message.id}>
                    {showDateSep && <DateSeparator timestamp={message.created_at} />}
                    <MessageBubble
                      message={message}
                      isFromCurrentUser={message.pubkey === user.pubkey}
                      onReply={handleReply}
                      onQuoteClick={findAndScrollToOriginal}
                    />
                  </Fragment>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-3 sm:px-4 pt-2 border-t border-border shrink-0">
          <div className="flex items-start gap-2 bg-muted/50 rounded p-2">
            <div className="border-l-2 border-primary pl-2 flex-1 min-w-0">
              <p className="text-xs text-muted-foreground line-clamp-2">{replyPreviewText}</p>
              <button
                onClick={() => scrollToMessage(replyTo.messageId)}
                className="text-xs text-link hover:underline mt-0.5"
              >
                Show in chat
              </button>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              title="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className={cn('px-3 py-2 sm:p-4 shrink-0', !replyTo && 'border-t border-border')}>
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
