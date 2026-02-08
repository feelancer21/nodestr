import { useMemo } from 'react';
import { nip19 } from 'nostr-tools';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CopyButton } from './CopyButton';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatRelativeTime, pubkeyToColor } from '@/lib/utils';

interface CardHeaderProps {
  pubkey: string;
  createdAt: number;
  onClick?: () => void;
  actions?: React.ReactNode;
}

function getInitials(name: string): string {
  const words = name.split(' ').filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return '??';
}

export function CardHeader({ pubkey, createdAt, onClick, actions }: CardHeaderProps) {
  const author = useAuthor(pubkey);

  const displayName = useMemo(() => {
    return author.data?.metadata?.name || genUserName(pubkey);
  }, [author.data?.metadata, pubkey]);

  const npub = useMemo(() => {
    try {
      return nip19.npubEncode(pubkey);
    } catch {
      return pubkey;
    }
  }, [pubkey]);

  const npubMobile = useMemo(() => {
    if (npub.startsWith('npub1')) {
      return `${npub.slice(0, 12)}...${npub.slice(-6)}`;
    }
    return npub.slice(0, 20);
  }, [npub]);

  const npubTablet = useMemo(() => {
    if (npub.startsWith('npub1')) {
      return `${npub.slice(0, 16)}...${npub.slice(-8)}`;
    }
    return npub.slice(0, 24);
  }, [npub]);

  const npubDesktop = useMemo(() => {
    if (npub.startsWith('npub1')) {
      return `${npub.slice(0, 24)}...${npub.slice(-8)}`;
    }
    return npub.slice(0, 32);
  }, [npub]);

  const avatarColor = useMemo(() => pubkeyToColor(pubkey), [pubkey]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const exactDateTime = useMemo(() => {
    return new Date(createdAt * 1000).toLocaleString();
  }, [createdAt]);

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-10 w-10">
        {author.data?.metadata?.picture && (
          <AvatarImage src={author.data.metadata.picture} alt={displayName} />
        )}
        <AvatarFallback
          style={{ backgroundColor: avatarColor }}
          className="text-white font-bold text-sm"
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onClick}
            className="font-semibold text-base text-foreground hover:text-primary transition truncate min-w-0"
          >
            {displayName}
          </button>
          <span
            className="text-xs text-muted-foreground shrink-0"
            title={exactDateTime}
          >
            {formatRelativeTime(createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-mono">
              <span className="md:hidden">{npubMobile}</span>
              <span className="hidden md:inline lg:hidden">{npubTablet}</span>
              <span className="hidden lg:inline">{npubDesktop}</span>
            </span>
            <CopyButton value={npub} className="shrink-0" />
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
