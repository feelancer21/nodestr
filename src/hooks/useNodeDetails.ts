import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useMempoolConfig } from './useMempoolConfig';
import { useClipAnnouncementLookup } from './useClipAnnouncementLookup';
import { useAuthor } from './useAuthor';
import type { Network, MempoolNode, OperatorInfo } from '@/types/search';
import { getSearchEndpoint, NETWORKS_WITH_API } from '@/lib/mempool';
import { CLIP_KIND, CLIP_NODE_INFO, verifyClipEvent } from '@/lib/clip';

interface NodeInfoData {
  event: NostrEvent;
  content: unknown;
}

interface UseNodeDetailsResult {
  node?: MempoolNode;
  operator: OperatorInfo;
  nodeInfo?: NodeInfoData;
  isLoading: boolean;
  isError: boolean;
}

export function useNodeDetails(pubkey: string, network: Network): UseNodeDetailsResult {
  const { baseUrl } = useMempoolConfig();
  const { nostr } = useNostr();
  const hasApi = NETWORKS_WITH_API.includes(network);

  // Query mempool.space for node data
  const nodeQuery = useQuery({
    queryKey: ['mempool-node', network, pubkey],
    queryFn: async (): Promise<MempoolNode | undefined> => {
      if (!hasApi) return undefined;

      // Use search endpoint with full pubkey
      const url = getSearchEndpoint(baseUrl, network, pubkey);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Node lookup failed: ${response.status}`);
      }

      const data = await response.json();

      // Find exact match by pubkey
      const exactMatch = data.nodes.find((n: MempoolNode) => n.public_key === pubkey);
      return exactMatch;
    },
    enabled: hasApi && pubkey.length > 0,
    staleTime: 60_000, // 1 minute
  });

  // Lookup CLIP announcement for this Lightning pubkey
  const announcementQuery = useClipAnnouncementLookup(pubkey ? [pubkey] : []);

  // Get the announcement data
  const announcement = announcementQuery.data?.[pubkey] || null;

  // Fetch Nostr profile if there's an announcement
  const authorQuery = useAuthor(announcement?.nostrPubkey);

  // Query CLIP Node Info (k=1) for this Lightning node + network
  // d-tag format: "1:<lightning-pubkey>:<network>"
  const nodeInfoDTag = `1:${pubkey}:${network}`;
  const nodeInfoQuery = useQuery({
    queryKey: ['clip-node-info', pubkey, network],
    queryFn: async ({ signal }): Promise<NodeInfoData | undefined> => {
      const filter = {
        kinds: [CLIP_KIND],
        '#k': ['1'], // Node Info
        '#d': [nodeInfoDTag],
      };

      console.log('[useNodeDetails] Querying Node Info with d-tag:', nodeInfoDTag);

      const events = await nostr.query([filter], { signal });
      const now = Math.floor(Date.now() / 1000);

      console.log('[useNodeDetails] Received Node Info events:', events.length);

      // Find the latest valid Node Info event
      let latestEvent: NostrEvent | null = null;
      for (const event of events) {
        const verification = verifyClipEvent(event, now);
        if (!verification.ok || !verification.identifier) {
          console.log('[useNodeDetails] Event verification failed:', verification.reason);
          continue;
        }
        if (verification.identifier.kind !== CLIP_NODE_INFO) {
          console.log('[useNodeDetails] Event is not Node Info, skipping');
          continue;
        }

        // Check if from the announced operator (if announcement exists)
        if (announcement && event.pubkey !== announcement.nostrPubkey) {
          console.log('[useNodeDetails] Event from different pubkey than announcement, skipping');
          continue;
        }

        if (!latestEvent || event.created_at > latestEvent.created_at) {
          latestEvent = event;
        }
      }

      if (!latestEvent) {
        console.log('[useNodeDetails] No valid Node Info event found');
        return undefined;
      }

      console.log('[useNodeDetails] Found valid Node Info event:', latestEvent.id);

      // Parse content
      let content: unknown = {};
      try {
        content = JSON.parse(latestEvent.content || '{}');
      } catch {
        content = {};
      }

      return { event: latestEvent, content };
    },
    enabled: pubkey.length > 0,
    staleTime: 60_000,
  });

  // Build operator info
  const operator: OperatorInfo = {
    pubkey: announcement?.nostrPubkey,
    name: authorQuery.data?.metadata?.name,
    picture: authorQuery.data?.metadata?.picture,
    hasAnnouncement: announcement !== null,
    lastAnnouncement: announcement?.createdAt,
    announcementEvent: announcement?.event,
  };

  return {
    node: nodeQuery.data,
    operator,
    nodeInfo: nodeInfoQuery.data,
    isLoading: nodeQuery.isLoading || announcementQuery.isLoading || nodeInfoQuery.isLoading,
    isError: nodeQuery.isError,
  };
}
