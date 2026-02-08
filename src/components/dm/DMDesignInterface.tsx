import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { MessageCircle, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageContent } from './MessageContent';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { pubkeyToColor, cn } from '@/lib/utils';
import { formatConversationTime, formatFullDateTime } from '@/lib/dmUtils';
import {
  DUMMY_CONVERSATIONS,
  DUMMY_MESSAGES,
  type DummyConversation,
  type DummyMessage,
} from '@/lib/dmDummyData';

interface DMDesignInterfaceProps {
  className?: string;
}

export function DMDesignInterface({ className }: DMDesignInterfaceProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPubkey = searchParams.get('to');
  const isMobile = useIsMobile();

  const selectConversation = useCallback((pubkey: string) => {
    setSearchParams({ to: pubkey }, { replace: false });
  }, [setSearchParams]);

  return (
    <div className={cn('flex gap-4 overflow-hidden', className)}>
      {/* Conversation List */}
      <div className={cn(
        'w-80 flex-shrink-0',
        isMobile && selectedPubkey && 'hidden',
        isMobile && !selectedPubkey && 'w-full'
      )}>
        <ConversationList
          selectedPubkey={selectedPubkey}
          onSelect={selectConversation}
        />
      </div>

      {/* Chat Area */}
      <div className={cn(
        'flex-1 min-w-0',
        isMobile && !selectedPubkey && 'hidden',
        isMobile && selectedPubkey && 'w-full'
      )}>
        {selectedPubkey ? (
          <ChatArea
            pubkey={selectedPubkey}
            isMobile={isMobile}
          />
        ) : (
          <Card className="border-border bg-card h-full">
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Select a conversation</p>
                <p className="text-xs mt-1">Your messages are encrypted and stored locally</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// --- Conversation List ---

interface ConversationListProps {
  selectedPubkey: string | null;
  onSelect: (pubkey: string) => void;
}

function ConversationList({ selectedPubkey, onSelect }: ConversationListProps) {
  if (DUMMY_CONVERSATIONS.length === 0) {
    return (
      <Card className="border-border bg-card h-full">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
        </div>
        <div className="flex items-center justify-center h-full text-center text-muted-foreground px-4">
          <div>
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a conversation from a node or operator page</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card h-full flex flex-col">
      <div className="p-4 border-b border-border shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Messages</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {DUMMY_CONVERSATIONS.map((conv) => (
            <ConversationRow
              key={conv.pubkey}
              conversation={conv}
              isSelected={selectedPubkey === conv.pubkey}
              onSelect={() => onSelect(conv.pubkey)}
            />
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

// --- Conversation Row ---

interface ConversationRowProps {
  conversation: DummyConversation;
  isSelected: boolean;
  onSelect: () => void;
}

function ConversationRow({ conversation, isSelected, onSelect }: ConversationRowProps) {
  const navigate = useNavigate();
  const author = useAuthor(conversation.pubkey);
  const displayName = author.data?.metadata?.name || genUserName(conversation.pubkey);
  const picture = author.data?.metadata?.picture;
  const avatarColor = pubkeyToColor(conversation.pubkey);
  const initials = displayName.slice(0, 2).toUpperCase();
  const hasUnread = conversation.unreadCount > 0;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/${nip19.npubEncode(conversation.pubkey)}`);
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 w-full p-3 rounded-lg text-left transition',
        isSelected
          ? 'bg-muted'
          : 'hover:bg-muted/50'
      )}
    >
      <button
        onClick={handleProfileClick}
        className="shrink-0 hover:opacity-80 transition-opacity"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={picture} alt={displayName} />
          <AvatarFallback
            style={{ backgroundColor: avatarColor }}
            className="text-white font-bold text-sm"
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleProfileClick}
            className={cn(
              'text-sm truncate hover:underline',
              hasUnread ? 'font-bold text-foreground' : 'font-medium text-foreground'
            )}
          >
            {displayName}
          </button>
          <span
            className="text-xs text-muted-foreground shrink-0"
            title={formatFullDateTime(conversation.lastActivity)}
          >
            {formatConversationTime(conversation.lastActivity)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            'text-xs truncate',
            hasUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'
          )}>
            {conversation.lastMessage}
          </p>
          {hasUnread && (
            <span className="bg-primary text-primary-foreground rounded-full text-xs min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center font-medium shrink-0">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// --- Chat Area ---

interface ChatAreaProps {
  pubkey: string;
  isMobile: boolean;
}

function ChatArea({ pubkey, isMobile }: ChatAreaProps) {
  const navigate = useNavigate();
  const author = useAuthor(pubkey);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const displayName = author.data?.metadata?.name || genUserName(pubkey);
  const picture = author.data?.metadata?.picture;
  const avatarColor = pubkeyToColor(pubkey);
  const initials = displayName.slice(0, 2).toUpperCase();
  const messages = DUMMY_MESSAGES.get(pubkey) || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pubkey]);

  const handleProfileClick = () => {
    navigate(`/${nip19.npubEncode(pubkey)}`);
  };

  return (
    <Card className={cn(
      'border-border bg-card h-full flex flex-col',
      isMobile && 'border-0 rounded-none'
    )}>
      {/* Chat Header - hidden on mobile (MobileHeader shows it instead) */}
      {!isMobile && (
        <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={picture} alt={displayName} />
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
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-2 sm:p-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="px-3 py-2 sm:p-4 border-t border-border shrink-0">
        <div className="flex gap-2 items-end">
          <AutoGrowTextarea disabled />
          <Button size="icon" className="h-9 w-9 sm:h-10 sm:w-10 shrink-0" disabled>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// --- Message Bubble ---

function MessageBubble({ message }: { message: DummyMessage }) {
  return (
    <div className={cn('flex mb-3 sm:mb-4', message.isFromMe ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 sm:px-4',
        message.isFromMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        <MessageContent content={message.content} isFromMe={message.isFromMe} />
        <span
          className={cn(
            'text-xs opacity-70 mt-1 block',
            message.isFromMe ? 'text-primary-foreground' : 'text-muted-foreground'
          )}
          title={formatFullDateTime(message.created_at)}
        >
          {formatConversationTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

// --- Auto-Growing Textarea ---

function AutoGrowTextarea({ disabled }: { disabled?: boolean }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');

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
      onChange={(e) => setValue(e.target.value)}
      disabled={disabled}
    />
  );
}
