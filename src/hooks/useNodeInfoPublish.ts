import { useMutation } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { CLIP_KIND } from '@/lib/clip';
import type { Network } from '@/types/search';

interface NodeInfoPayload {
  about?: string;
  max_channel_size_sat?: number;
  min_channel_size_sat?: number;
  contact_info?: ContactInfoEntry[];
  custom_records?: Record<string, string>;
}

interface ContactInfoEntry {
  type: string;
  value: string;
  note?: string;
  primary?: boolean;
}

interface UseNodeInfoPublishOptions {
  lightningPubkey: string;
  network: Network;
}

export interface UseNodeInfoPublishResult {
  publish: (payload: NodeInfoPayload) => Promise<NostrEvent>;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
  reset: () => void;
}

const MAX_CONTENT_BYTES = 1_000_000; // 1MB

function validatePayload(payload: NodeInfoPayload): void {
  // Go validate tag: "omitempty,gtefield=MinChannelSizeSat"
  if (
    payload.min_channel_size_sat != null &&
    payload.max_channel_size_sat != null &&
    payload.max_channel_size_sat < payload.min_channel_size_sat
  ) {
    throw new Error('Maximum channel size must be greater than or equal to minimum channel size.');
  }

  // Channel sizes must be non-negative integers
  if (payload.min_channel_size_sat != null) {
    if (!Number.isInteger(payload.min_channel_size_sat) || payload.min_channel_size_sat < 0) {
      throw new Error('Minimum channel size must be a non-negative integer.');
    }
  }
  if (payload.max_channel_size_sat != null) {
    if (!Number.isInteger(payload.max_channel_size_sat) || payload.max_channel_size_sat < 0) {
      throw new Error('Maximum channel size must be a non-negative integer.');
    }
  }

  // Validate each contact entry
  for (const contact of payload.contact_info ?? []) {
    if (!contact.type?.trim()) {
      throw new Error('Contact type is required for all contact entries.');
    }
    if (!contact.value?.trim()) {
      throw new Error('Contact value is required for all contact entries.');
    }
  }

  // At most one primary contact
  const primaryCount = (payload.contact_info ?? []).filter(c => c.primary).length;
  if (primaryCount > 1) {
    throw new Error('Only one contact may be marked as primary.');
  }

  // Custom records: keys must be non-empty
  if (payload.custom_records) {
    for (const key of Object.keys(payload.custom_records)) {
      if (!key.trim()) {
        throw new Error('Custom record key must not be empty.');
      }
    }
  }
}

function cleanPayload(raw: NodeInfoPayload): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (raw.about?.trim()) {
    result.about = raw.about.trim();
  }

  // 0 is a valid value (Go: *uint64 pointing to 0 is not nil)
  if (raw.min_channel_size_sat != null) {
    result.min_channel_size_sat = raw.min_channel_size_sat;
  }

  if (raw.max_channel_size_sat != null) {
    result.max_channel_size_sat = raw.max_channel_size_sat;
  }

  if (raw.contact_info?.length) {
    result.contact_info = raw.contact_info.map(c => {
      const entry: Record<string, unknown> = {
        type: c.type,
        value: c.value,
      };
      if (c.note?.trim()) {
        entry.note = c.note.trim();
      }
      if (c.primary) {
        entry.primary = true;
      }
      return entry;
    });
  }

  if (raw.custom_records && Object.keys(raw.custom_records).length > 0) {
    result.custom_records = raw.custom_records;
  }

  return result;
}

export function useNodeInfoPublish({
  lightningPubkey,
  network,
}: UseNodeInfoPublishOptions): UseNodeInfoPublishResult {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (payload: NodeInfoPayload): Promise<NostrEvent> => {
      if (!user) throw new Error('User not logged in');

      // 1. Validate payload
      validatePayload(payload);

      // 2. Clean payload (remove empty/undefined fields)
      const cleaned = cleanPayload(payload);

      // 3. Serialize content
      const content = JSON.stringify(cleaned);

      // 4. Check content size
      if (new TextEncoder().encode(content).length > MAX_CONTENT_BYTES) {
        throw new Error('Node Info content exceeds maximum size (1MB).');
      }

      // 5. Build event tags
      const dTag = `1:${lightningPubkey}:${network}`;
      const tags: string[][] = [
        ['d', dTag],
        ['k', '1'],
      ];

      // Add client tag (same as useNostrPublish pattern)
      if (location.protocol === 'https:') {
        tags.push(['client', location.hostname]);
      }

      // 6. Sign via NIP-07
      const signedEvent = await user.signer.signEvent({
        kind: CLIP_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
      });

      // 7. Publish to relays
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });

      return signedEvent;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Node Info published successfully.',
      });
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error: Error) => {
      let message = error.message || 'Failed to publish Node Info.';

      if (message.includes('User rejected') || message.includes('cancelled')) {
        message = 'Signing was cancelled. Please approve the signing request in your extension.';
      } else if (message.includes('No signer') || message.includes('extension')) {
        message = 'No Nostr signer found. Please install a NIP-07 extension.';
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });

  return {
    publish: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
  };
}
