import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { CheckCheck, Info, Loader2 } from 'lucide-react';
import { useDMContext } from '@/hooks/useDMContext';
import { useAuthor } from '@/hooks/useAuthor';
import { useUnread } from '@/contexts/UnreadContext';
import { genUserName } from '@/lib/genUserName';
import { formatConversationTime, formatFullDateTime } from '@/lib/dmUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, pubkeyToColor } from '@/lib/utils';
import { LOADING_PHASES } from '@/lib/dmConstants';

interface DMConversationListProps {
  selectedPubkey: string | null;
  onSelectConversation: (pubkey: string) => void;
  className?: string;
  onStatusClick?: () => void;
  drafts?: Map<string, string>;
}

interface ConversationItemProps {
  pubkey: string;
  isSelected: boolean;
  onClick: () => void;
  lastMessage: { decryptedContent?: string; error?: string } | null;
  lastActivity: number;
  unreadCount?: number;
  draft?: string;
}

const ConversationItemComponent = ({
  pubkey,
  isSelected,
  onClick,
  lastMessage,
  lastActivity,
  unreadCount,
  draft,
}: ConversationItemProps) => {
  const navigate = useNavigate();
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;

  const displayName = metadata?.name || genUserName(pubkey);
  const avatarUrl = metadata?.picture;
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarColor = pubkeyToColor(pubkey);

  const hasDraft = draft && draft.trim().length > 0;
  const lastMessagePreview = lastMessage?.error
    ? 'Encrypted message'
    : lastMessage?.decryptedContent || 'No messages yet';

  const isLoadingProfile = author.isLoading && !metadata;
  const hasUnread = unreadCount && unreadCount > 0;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${nip19.npubEncode(pubkey)}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={cn(
        'flex items-start gap-3 w-full p-3 rounded-lg text-left transition cursor-pointer',
        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
      )}
    >
      {isLoadingProfile ? (
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      ) : (
        <button
          onClick={handleProfileClick}
          className="shrink-0 hover:opacity-80 transition-opacity"
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
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {isLoadingProfile ? (
            <Skeleton className="h-[1.25rem] w-24" />
          ) : (
            <span
              className={cn(
                'text-sm truncate',
                hasUnread ? 'font-bold text-foreground' : 'font-medium text-foreground'
              )}
            >
              {displayName}
            </span>
          )}
          <span
            className="text-xs text-muted-foreground shrink-0"
            title={formatFullDateTime(lastActivity)}
          >
            {formatConversationTime(lastActivity)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            'text-xs truncate',
            hasDraft ? 'text-muted-foreground' : hasUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'
          )}>
            {hasDraft ? (
              <><span className="text-emerald-500 font-medium">Draft: </span>{draft}</>
            ) : (
              lastMessagePreview
            )}
          </p>
          {hasUnread && (
            <span className="bg-primary text-primary-foreground rounded-full text-xs min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center font-medium shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ConversationItem = memo(ConversationItemComponent);
ConversationItem.displayName = 'ConversationItem';

const ConversationListSkeleton = () => {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DMConversationList = ({
  selectedPubkey,
  onSelectConversation,
  className,
  onStatusClick,
  drafts,
}: DMConversationListProps) => {
  const { conversations, isLoading, loadingPhase } = useDMContext();
  const { unreadCounts, totalUnread, markAllAsRead } = useUnread();

  const isInitialLoad = (loadingPhase === LOADING_PHASES.CACHE || loadingPhase === LOADING_PHASES.RELAYS) && conversations.length === 0;

  return (
    <Card className={cn('border-border bg-card h-full flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          {(loadingPhase === LOADING_PHASES.CACHE ||
            loadingPhase === LOADING_PHASES.RELAYS ||
            loadingPhase === LOADING_PHASES.SUBSCRIPTIONS) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {loadingPhase === LOADING_PHASES.CACHE && 'Loading from cache...'}
                    {loadingPhase === LOADING_PHASES.RELAYS && 'Querying relays for new messages...'}
                    {loadingPhase === LOADING_PHASES.SUBSCRIPTIONS && 'Setting up subscriptions...'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-1">
          {totalUnread > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={markAllAsRead}
                    aria-label="Mark all as read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Mark all as read</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onStatusClick && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onStatusClick}
              aria-label="View messaging status"
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {(isLoading || isInitialLoad) ? (
          <ConversationListSkeleton />
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground px-4">
            <div>
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a conversation from a node or operator page</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-2">
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.pubkey}
                  pubkey={conversation.pubkey}
                  isSelected={selectedPubkey === conversation.pubkey}
                  onClick={() => onSelectConversation(conversation.pubkey)}
                  lastMessage={conversation.lastMessage}
                  lastActivity={conversation.lastActivity}
                  unreadCount={unreadCounts.get(conversation.pubkey)}
                  draft={drafts?.get(conversation.pubkey)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
};
