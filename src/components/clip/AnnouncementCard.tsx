import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import type { ClipIdentifier } from '@/lib/clip';
import { Card, CardContent, CardHeader as UICardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardHeader } from './CardHeader';
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
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              Announcement
            </Badge>
            <div className="flex items-center gap-2">
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
