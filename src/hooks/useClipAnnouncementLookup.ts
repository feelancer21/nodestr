import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { verifyClipEvent, CLIP_ANNOUNCEMENT, CLIP_KIND } from '@/lib/clip';

interface AnnouncementMap {
  [lightningPubkey: string]: {
    nostrPubkey: string;
    createdAt: number;
    eventId: string;
    event: NostrEvent;
  } | null;
}

export function useClipAnnouncementLookup(lightningPubkeys: string[]) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['clip-announcements', lightningPubkeys.sort().join(',')],
    queryFn: async ({ signal }): Promise<AnnouncementMap> => {
      if (lightningPubkeys.length === 0) return {};

      const filter = {
        kinds: [CLIP_KIND],
        '#k': ['0'],
        '#d': lightningPubkeys,
      };

      console.log('[useClipAnnouncementLookup] Querying announcements for pubkeys:', lightningPubkeys);

      const events = await nostr.query([filter], { signal });
      const now = Math.floor(Date.now() / 1000);
      const result: AnnouncementMap = {};

      // Initialize all as null
      for (const pk of lightningPubkeys) {
        result[pk] = null;
      }

      console.log('[useClipAnnouncementLookup] Received events:', events.length);

      // Process events, keeping latest per lightning pubkey
      for (const event of events) {
        const verification = verifyClipEvent(event, now);
        if (!verification.ok) {
          console.log('[useClipAnnouncementLookup] Event verification failed:', verification.reason);
          continue;
        }
        if (!verification.identifier || verification.identifier.kind !== CLIP_ANNOUNCEMENT) {
          continue;
        }

        const lnPubkey = verification.identifier.pubkey;
        const existing = result[lnPubkey];

        if (!existing || event.created_at > existing.createdAt) {
          result[lnPubkey] = {
            nostrPubkey: event.pubkey,
            createdAt: event.created_at,
            eventId: event.id,
            event: event,
          };
        }
      }

      console.log('[useClipAnnouncementLookup] Announcement map:', result);
      return result;
    },
    enabled: lightningPubkeys.length > 0,
    staleTime: 60_000,
  });
}
