import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { CLIP_ANNOUNCEMENT, CLIP_KIND, CLIP_NODE_INFO, verifyClipEvent } from '@/lib/clip';
import { ClipStore } from '@/lib/clipStore';

const FEED_WINDOW_SECONDS = 365 * 24 * 60 * 60;
const ANNOUNCEMENT_WINDOW_SECONDS = 365 * 24 * 60 * 60;

export interface OperatorNodeInfo {
  lightningPubkey: string;
  networks: string[];
  nodeInfoPayloads: Array<{
    network: string;
    content: unknown;
  }>;
}

export interface OperatorProfile {
  pubkey: string;
  metadata: {
    name?: string;
    picture?: string;
    about?: string;
  };
  operatedNodes: OperatorNodeInfo[];
  events: Array<{
    kind: 0 | 1;
    event: NostrEvent;
    content?: unknown;
  }>;
}

/**
 * Fetches and derives operator profile data from CLIP events.
 * A user is a node operator if they have published a valid Node Announcement (k=0).
 */
export function useOperatorProfile(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['operator-profile', pubkey],
    queryFn: async ({ signal }) => {
      const now = Math.floor(Date.now() / 1000);
      const announcementsSince = now - ANNOUNCEMENT_WINDOW_SECONDS;
      const feedSince = now - FEED_WINDOW_SECONDS;

      const store = new ClipStore();
      const errors: unknown[] = [];

      // Fetch all announcements (long window)
      try {
        const announcementEvents = await nostr.query(
          [
            {
              kinds: [CLIP_KIND],
              authors: [pubkey],
              since: announcementsSince,
              limit: 500,
            },
          ],
          { signal }
        );

        announcementEvents.forEach((event: NostrEvent) => {
          const result = verifyClipEvent(event, now);
          if (result.ok && result.identifier.kind === CLIP_ANNOUNCEMENT) {
            store.store({ event, identifier: result.identifier });
          }
        });
      } catch (error) {
        errors.push(error);
      }

      // Fetch Node Info events (feed window)
      try {
        const infoEvents = await nostr.query(
          [
            {
              kinds: [CLIP_KIND],
              authors: [pubkey],
              since: feedSince,
              limit: 500,
            },
          ],
          { signal }
        );

        infoEvents.forEach((event: NostrEvent) => {
          const result = verifyClipEvent(event, now);
          if (result.ok && result.identifier.kind === CLIP_NODE_INFO) {
            store.store({ event, identifier: result.identifier });
          }
        });
      } catch (error) {
        errors.push(error);
      }

      if (errors.length === 2) {
        throw errors[0];
      }

      // Extract announcements (to determine operated nodes)
      const announcements = store.getEvents(CLIP_ANNOUNCEMENT);
      const operatedNodePubkeys = new Set(
        announcements.map((stored) => stored.identifier.pubkey)
      );

      // Extract node info for these nodes
      const allNodeInfos = store.getEvents(CLIP_NODE_INFO);
      const nodeInfosByPubkey = new Map<
        string,
        Array<{ network: string; event: NostrEvent; content?: unknown }>
      >();

      for (const stored of allNodeInfos) {
        if (!operatedNodePubkeys.has(stored.identifier.pubkey)) continue;

        const network = stored.identifier.network || 'unknown';
        if (!nodeInfosByPubkey.has(stored.identifier.pubkey)) {
          nodeInfosByPubkey.set(stored.identifier.pubkey, []);
        }

        let content: unknown;
        try {
          content = JSON.parse(stored.event.content || '{}');
        } catch {
          content = {};
        }

        nodeInfosByPubkey.get(stored.identifier.pubkey)!.push({
          network,
          event: stored.event,
          content,
        });
      }

      // Build operated nodes list
      const operatedNodes: OperatorNodeInfo[] = Array.from(operatedNodePubkeys).map((lnPubkey) => {
        const infos = nodeInfosByPubkey.get(lnPubkey) || [];
        const networks = [...new Set(infos.map((i) => i.network))];

        return {
          lightningPubkey: lnPubkey,
          networks,
          nodeInfoPayloads: infos.map((i) => ({
            network: i.network,
            content: i.content,
          })),
        };
      });

      // Collect all events authored by this pubkey for timeline
      const timelineEvents = [
        ...announcements,
        ...allNodeInfos.filter((e) => operatedNodePubkeys.has(e.identifier.pubkey)),
      ].map((stored) => {
        let content: unknown;
        try {
          content = JSON.parse(stored.event.content || '{}');
        } catch {
          content = undefined;
        }

        return {
          kind: stored.identifier.kind as 0 | 1,
          event: stored.event,
          content,
        };
      });

      // Sort timeline by created_at descending
      timelineEvents.sort((a, b) => b.event.created_at - a.event.created_at);

      return {
        pubkey,
        metadata: {
          // Kind 0 metadata will be fetched separately
        },
        operatedNodes: operatedNodes.sort(
          (a, b) => b.lightningPubkey.localeCompare(a.lightningPubkey)
        ),
        events: timelineEvents,
      } as OperatorProfile;
    },
  });
}
