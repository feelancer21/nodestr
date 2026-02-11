import { useState, useMemo } from 'react';
import { nip19 } from 'nostr-tools';
import { useDMContext } from '@/hooks/useDMContext';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Search } from 'lucide-react';
import { cn, pubkeyToColor } from '@/lib/utils';

interface ForwardMessageDialogProps {
  message: { content: string; messageId: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onForward: (recipientPubkey: string) => Promise<void>;
}

function tryDecodeNpub(input: string): string | null {
  try {
    const decoded = nip19.decode(input.trim());
    if (decoded.type === 'npub') return decoded.data;
    return null;
  } catch {
    return null;
  }
}

// --- Contact list item with avatar + name ---

function ContactItem({
  pubkey,
  isSelected,
  onClick,
}: {
  pubkey: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;

  const displayName = metadata?.name || genUserName(pubkey);
  const avatarUrl = metadata?.picture;
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarColor = pubkeyToColor(pubkey);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full p-2 rounded-lg text-left transition cursor-pointer',
        isSelected ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted/50'
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback
          style={{ backgroundColor: avatarColor }}
          className="text-white font-bold text-xs"
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm truncate flex-1">{displayName}</span>
      <div className={cn(
        'h-4 w-4 rounded-full border-2 shrink-0 transition',
        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
      )} />
    </button>
  );
}

export function ForwardMessageDialog({
  message,
  open,
  onOpenChange,
  onForward,
}: ForwardMessageDialogProps) {
  const { conversations } = useDMContext();

  const [selectedPubkey, setSelectedPubkey] = useState<string | null>(null);
  const [npubInput, setNpubInput] = useState('');
  const [search, setSearch] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [npubError, setNpubError] = useState<string | null>(null);

  // Derive npub-decoded pubkey (if valid)
  const npubPubkey = useMemo(() => {
    if (!npubInput.trim()) return null;
    return tryDecodeNpub(npubInput);
  }, [npubInput]);

  // The effective recipient: selected contact or valid npub
  const effectiveRecipient = npubInput.trim() ? npubPubkey : selectedPubkey;

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const lowerSearch = search.toLowerCase();
    return conversations.filter(c => {
      const npub = nip19.npubEncode(c.pubkey).toLowerCase();
      return c.pubkey.toLowerCase().includes(lowerSearch) || npub.includes(lowerSearch);
    });
  }, [conversations, search]);

  const handleForward = async () => {
    if (!effectiveRecipient || !message) return;
    setIsSending(true);
    try {
      await onForward(effectiveRecipient);
    } finally {
      setIsSending(false);
    }
  };

  const handleNpubChange = (value: string) => {
    setNpubInput(value);
    setSelectedPubkey(null);
    if (value.trim() && !tryDecodeNpub(value)) {
      setNpubError('Invalid npub');
    } else {
      setNpubError(null);
    }
  };

  const handleContactSelect = (pubkey: string) => {
    setSelectedPubkey(pubkey);
    setNpubInput('');
    setNpubError(null);
  };

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedPubkey(null);
      setNpubInput('');
      setSearch('');
      setNpubError(null);
      setIsSending(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
          <DialogDescription>Select a recipient</DialogDescription>
        </DialogHeader>

        {/* Search contacts */}
        {conversations.length > 0 && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Contact list */}
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1">
                {filteredConversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No contacts found</p>
                ) : (
                  filteredConversations.map((c) => (
                    <ContactItem
                      key={c.pubkey}
                      pubkey={c.pubkey}
                      isSelected={selectedPubkey === c.pubkey && !npubInput.trim()}
                      onClick={() => handleContactSelect(c.pubkey)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* npub input */}
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            {conversations.length > 0 ? 'Or enter npub:' : 'Enter npub:'}
          </label>
          <Input
            placeholder="npub1..."
            value={npubInput}
            onChange={(e) => handleNpubChange(e.target.value)}
          />
          {npubError && npubInput.trim() && (
            <p className="text-xs text-destructive">{npubError}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={!effectiveRecipient || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Forwarding...
              </>
            ) : (
              'Forward'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
