import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import type { ClipIdentifier } from '@/lib/clip';
import { Card, CardContent, CardHeader as UICardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardHeader } from './CardHeader';
import { CopyButton } from './CopyButton';
import { ViewSourceModal } from './ViewSourceModal';
import { AnnouncementModal } from '@/components/node/AnnouncementModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface AnnouncementCardProps {
  event: NostrEvent;
  identifier: ClipIdentifier;
  onClick?: () => void;
}

export function AnnouncementCard({ event, identifier, onClick }: AnnouncementCardProps) {
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const { user } = useCurrentUser();

  const handleRenewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnnouncementModalOpen(true);
  };

  return (
    <>
      <Card
        className={`border-border bg-card text-card-foreground transition overflow-hidden ${
          onClick ? 'cursor-pointer hover:bg-accent/50' : ''
        }`}
        onClick={(e) => {
          if (!onClick) return;
          // Don't navigate if user is selecting text
          const selection = window.getSelection()?.toString();
          if (selection) return;
          // Don't navigate if clicking on interactive elements
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a')) {
            return;
          }
          onClick();
        }}
      >
        <UICardHeader className="pb-3">
          <CardHeader
            pubkey={event.pubkey}
            createdAt={event.created_at}
            onClick={onClick}
          />
        </UICardHeader>

        <CardContent className="pt-0">
          <Badge variant="secondary">
            Announcement
          </Badge>

          {/* Lightning pubkey row */}
          <div className="flex items-center gap-1 mt-3">
            <span className="text-xs text-muted-foreground font-mono">
              <span className="md:hidden">{identifier.pubkey.slice(0, 12)}...{identifier.pubkey.slice(-8)}</span>
              <span className="hidden md:inline lg:hidden">{identifier.pubkey.slice(0, 16)}...{identifier.pubkey.slice(-8)}</span>
              <span className="hidden lg:inline">{identifier.pubkey.slice(0, 20)}...{identifier.pubkey.slice(-8)}</span>
            </span>
            <CopyButton value={identifier.pubkey} />
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-end gap-2 mt-3">
            {user && (
              <button
                onClick={handleRenewClick}
                className="text-muted-foreground hover:text-foreground transition"
                title="Renew Announcement"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
            <ViewSourceModal event={event} />
          </div>
        </CardContent>
      </Card>

      {/* Announcement Modal for renewal */}
      <AnnouncementModal
        open={announcementModalOpen}
        onOpenChange={setAnnouncementModalOpen}
        lightningPubkey={identifier.pubkey}
        isRenew={true}
      />
    </>
  );
}
