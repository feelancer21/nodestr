import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { CLIP_ANNOUNCEMENT, CLIP_KIND, CLIP_NODE_INFO, verifyClipEvent } from '@/lib/clip';
import { ClipStore } from '@/lib/clipStore';

const FEED_WINDOW_SECONDS = 365 * 24 * 60 * 60;
const ANNOUNCEMENT_WINDOW_SECONDS = 365 * 24 * 60 * 60;

export interface ClipFeedDiagnostics {
  announcementQueryCount: number;
  infoQueryCount: number;
  announcementAccepted: number;
  infoAccepted: number;
  verifyFailures: Record<string, number>;
  storeRejections: Record<string, number>;
  errors: string[];
}

const emptyDiagnostics: ClipFeedDiagnostics = {
  announcementQueryCount: 0,
  infoQueryCount: 0,
  announcementAccepted: 0,
  infoAccepted: 0,
  verifyFailures: {},
  storeRejections: {},
  errors: [],
};

function bump(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export function useClipFeed() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['clip-feed'],
    queryFn: async ({ signal }) => {
      const now = Math.floor(Date.now() / 1000);
      const announcementsSince = now - ANNOUNCEMENT_WINDOW_SECONDS;
      const feedSince = now - FEED_WINDOW_SECONDS;

      const store = new ClipStore();
      const errors: unknown[] = [];
      const diagnostics: ClipFeedDiagnostics = { ...emptyDiagnostics };

      try {
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

        diagnostics.announcementQueryCount = announcementEvents.length;

        announcementEvents.forEach((event: NostrEvent) => {
          const result = verifyClipEvent(event, now);
          if (!result.ok) {
            bump(diagnostics.verifyFailures, result.reason);
            return;
          }

          if (result.identifier.kind !== CLIP_ANNOUNCEMENT) {
            bump(diagnostics.verifyFailures, 'unexpected_kind_in_announcement_query');
            return;
          }

          const stored = store.store({ event, identifier: result.identifier });
          if (!stored.stored && stored.reason) {
            bump(diagnostics.storeRejections, stored.reason);
            return;
          }

          diagnostics.announcementAccepted += 1;
        });
      } catch (error) {
        errors.push(error);
        diagnostics.errors.push(error instanceof Error ? error.message : 'announcement_query_failed');
      }

      try {
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

        diagnostics.infoQueryCount = infoEvents.length;

        infoEvents.forEach((event: NostrEvent) => {
          const result = verifyClipEvent(event, now);
          if (!result.ok) {
            bump(diagnostics.verifyFailures, result.reason);
            return;
          }

          if (result.identifier.kind !== CLIP_NODE_INFO) {
            bump(diagnostics.verifyFailures, 'unexpected_kind_in_info_query');
            return;
          }

          const stored = store.store({ event, identifier: result.identifier });
          if (!stored.stored && stored.reason) {
            bump(diagnostics.storeRejections, stored.reason);
            return;
          }

          diagnostics.infoAccepted += 1;
        });
      } catch (error) {
        errors.push(error);
        diagnostics.errors.push(error instanceof Error ? error.message : 'info_query_failed');
      }

      if (errors.length === 2) {
        throw errors[0];
      }

      const events = store.getEvents();
      return {
        events: events.sort((a, b) => b.event.created_at - a.event.created_at),
        diagnostics,
      };
    },
  });
}
