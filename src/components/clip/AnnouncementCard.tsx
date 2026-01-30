import type { NostrEvent } from '@nostrify/nostrify';
import type { ClipIdentifier } from '@/lib/clip';
import { Card, CardContent, CardHeader as UICardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardHeader } from './CardHeader';
import { ViewSourceModal } from './ViewSourceModal';

interface AnnouncementCardProps {
  event: NostrEvent;
  identifier: ClipIdentifier;
  onClick?: () => void;
}

export function AnnouncementCard({ event, onClick }: AnnouncementCardProps) {
  return (
    <Card
      className={`border-border bg-card text-card-foreground transition overflow-hidden ${
        onClick ? 'cursor-pointer hover:bg-accent/50' : ''
      }`}
      onClick={(e) => {
        if (!onClick) return;
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
          <ViewSourceModal event={event} />
        </div>
      </CardContent>
    </Card>
  );
}
