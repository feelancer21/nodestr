import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { CLIP_ANNOUNCEMENT, CLIP_KIND, CLIP_NODE_INFO, verifyClipEvent } from '@/lib/clip';
import { ClipStore } from '@/lib/clipStore';

const FEED_WINDOW_SECONDS = 365 * 24 * 60 * 60;
const ANNOUNCEMENT_WINDOW_SECONDS = 365 * 24 * 60 * 60;

export function useClipFeed() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['clip-feed'],
    queryFn: async ({ signal }) => {
      const now = Math.floor(Date.now() / 1000);
      const announcementsSince = now - ANNOUNCEMENT_WINDOW_SECONDS;
      const feedSince = now - FEED_WINDOW_SECONDS;

      console.log('[useClipFeed] Starting feed fetch:', { announcementsSince, feedSince, now });

      const store = new ClipStore();
      const errors: unknown[] = [];

      try {
        console.log('[useClipFeed] Fetching announcements...');
        const announcementEvents = await nostr.query(
          [
            {
              kinds: [CLIP_KIND],
              since: announcementsSince,
              limit: 500,
            },
          ],
          { signal }
        );

        console.log('[useClipFeed] Received announcements:', announcementEvents.length);
        announcementEvents.forEach((event: NostrEvent) => {
          const result = verifyClipEvent(event, now);
          if (result.ok && result.identifier.kind === CLIP_ANNOUNCEMENT) {
            store.store({ event, identifier: result.identifier });
          }
        });
      } catch (error) {
        console.error('[useClipFeed] Error fetching announcements:', error);
        errors.push(error);
      }

      try {
        console.log('[useClipFeed] Fetching node info...');
        const infoEvents = await nostr.query(
          [
            {
              kinds: [CLIP_KIND],
              since: feedSince,
              limit: 500,
            },
          ],
          { signal }
        );

        console.log('[useClipFeed] Received node info:', infoEvents.length);
        infoEvents.forEach((event: NostrEvent) => {
          const result = verifyClipEvent(event, now);
          if (result.ok && result.identifier.kind === CLIP_NODE_INFO) {
            store.store({ event, identifier: result.identifier });
          }
        });
      } catch (error) {
        console.error('[useClipFeed] Error fetching node info:', error);
        errors.push(error);
      }

      if (errors.length === 2) {
        console.error('[useClipFeed] Both queries failed, throwing error');
        throw errors[0];
      }

      const events = store.getEvents();
      console.log('[useClipFeed] Feed complete, total events:', events.length);
      return events.sort((a, b) => b.event.created_at - a.event.created_at);
    },
  });
}
