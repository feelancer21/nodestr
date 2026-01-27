import type { ClipStoredEvent } from '@/lib/clipStore';
import { CLIP_ANNOUNCEMENT } from '@/lib/clip';
import { AnnouncementCard } from './AnnouncementCard';
import { NodeInfoCard } from './NodeInfoCard';

interface ClipEventCardProps {
  storedEvent: ClipStoredEvent;
  onClick?: () => void;
}

export function ClipEventCard({ storedEvent, onClick }: ClipEventCardProps) {
  const { event, identifier } = storedEvent;

  if (identifier.kind === CLIP_ANNOUNCEMENT) {
    return (
      <AnnouncementCard event={event} identifier={identifier} onClick={onClick} />
    );
  }

  // Parse Node Info content
  let content: unknown = {};
  try {
    content = JSON.parse(event.content || '{}');
  } catch {
    content = {};
  }

  return (
    <NodeInfoCard event={event} identifier={identifier} content={content} onClick={onClick} />
  );
}
