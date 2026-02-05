import { useMemo, useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { getEventHash } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { CLIP_KIND } from '@/lib/clip';
import { verifyLightningSignature } from '@/lib/lnVerify';

/**
 * zbase32 alphabet as defined by the CLIP protocol.
 * Used for validating Lightning signatures.
 */
const ZBASE32_ALPHABET = 'ybndrfg8ejkmcpqxot1uwisza345h769';

/**
 * Validates that a string is valid zbase32 encoding.
 * Lightning signatures are encoded in zbase32 format.
 */
export function isValidZbase32(signature: string): boolean {
  if (!signature || signature.length === 0) return false;
  return [...signature.toLowerCase()].every(char => ZBASE32_ALPHABET.includes(char));
}

export interface UseAnnouncementPublishOptions {
  lightningPubkey: string;
}

export interface PreviewEvent {
  kind: number;
  pubkey: string;
  created_at: number;
  tags: string[][];
  content: string;
}

export interface UseAnnouncementPublishResult {
  /** The hash to be signed by the Lightning node (hex-encoded SHA256) */
  eventHash: string;
  /** Preview of the event structure (without sig tag initially) */
  previewEvent: PreviewEvent | null;
  /** The timestamp used for the event (stable across renders) */
  timestamp: number;
  /** Publish the announcement with the provided Lightning signature */
  publish: (lightningSignature: string) => Promise<NostrEvent>;
  /** Whether the publish mutation is pending */
  isPending: boolean;
  /** Whether the publish was successful */
  isSuccess: boolean;
  /** Error from the publish mutation */
  error: Error | null;
  /** Reset the mutation state */
  reset: () => void;
  /** Refresh the timestamp (regenerates hash) */
  refreshTimestamp: () => void;
}

/**
 * Hook for publishing Node Announcement (CLIP k=0) events.
 *
 * Implements the CLIP signing workflow:
 * 1. Build event with d and k tags, content "{}"
 * 2. Set pubkey to user's Nostr pubkey
 * 3. Set created_at to current Unix timestamp
 * 4. Compute event hash (SHA256 of serialized event WITHOUT sig tag) - this is what Lightning signs
 * 5. User signs hash externally with Lightning node → gets zbase32 signature
 * 6. Add sig tag with Lightning signature
 * 7. Request Nostr signature via NIP-07 (signs the full event INCLUDING sig tag)
 * 8. Publish to relays
 *
 * The hash computation follows the Go reference implementation exactly:
 * - Hash = hex(SHA256(serialize([0, pubkey, created_at, kind, tags_without_sig, content])))
 * - This is equivalent to the Nostr event ID calculation from NIP-01
 */
export function useAnnouncementPublish({
  lightningPubkey,
}: UseAnnouncementPublishOptions): UseAnnouncementPublishResult {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();

  // Stable timestamp that only changes when explicitly refreshed
  const [timestamp, setTimestamp] = useState(() => Math.floor(Date.now() / 1000));

  const refreshTimestamp = useCallback(() => {
    setTimestamp(Math.floor(Date.now() / 1000));
  }, []);

  // Build the unsigned event (without sig tag)
  // This matches the Go reference: event with d, k tags and content "{}"
  const unsignedEvent = useMemo(() => {
    if (!user?.pubkey) return null;

    return {
      kind: CLIP_KIND,
      pubkey: user.pubkey,
      created_at: timestamp,
      tags: [
        ['d', lightningPubkey],
        ['k', '0'],
      ],
      content: '{}',
    };
  }, [lightningPubkey, user?.pubkey, timestamp]);

  // Compute the hash for Lightning signing
  // From Go reference (event.go): Hash() returns []byte(e.copyWithoutSig().GetID())
  // GetID() returns the hex-encoded SHA256 of the NIP-01 serialized event
  // Since our unsignedEvent has no sig tag, this is exactly what we need
  const eventHash = useMemo(() => {
    if (!unsignedEvent) return '';

    // getEventHash from nostr-tools implements NIP-01:
    // SHA256(JSON.stringify([0, pubkey, created_at, kind, tags, content]))
    // The result is hex-encoded, which matches the Go reference
    return getEventHash(unsignedEvent as NostrEvent);
  }, [unsignedEvent]);

  // Mutation for publishing
  const mutation = useMutation({
    mutationFn: async (lightningSignature: string): Promise<NostrEvent> => {
      if (!user) {
        throw new Error('User not logged in');
      }

      if (!unsignedEvent) {
        throw new Error('Event not ready');
      }

      // Validate signature format
      if (!isValidZbase32(lightningSignature)) {
        throw new Error('Invalid signature format. Please paste the zbase32 signature from your Lightning node.');
      }

      // Cryptographically verify the Lightning signature
      const verification = verifyLightningSignature(eventHash, lightningSignature.trim(), lightningPubkey);
      if (!verification.valid) {
        throw new Error(`Lightning signature verification failed: ${verification.error}`);
      }

      // Step 6: Add Lightning signature tag
      // This follows Go CombinedSigner.signWithLn which appends the sig tag
      const eventWithLnSig = {
        kind: unsignedEvent.kind,
        created_at: unsignedEvent.created_at,
        tags: [
          ...unsignedEvent.tags,
          ['sig', lightningSignature.trim()],
        ],
        content: unsignedEvent.content,
      };

      // Step 7: Request Nostr signature via NIP-07
      // The signer will add pubkey, id, and sig to complete the event
      const signedEvent = await user.signer.signEvent(eventWithLnSig);

      // Step 8: Publish to relays
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });

      return signedEvent;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Node Announcement published successfully.',
      });
      // Reload page to show new announcement
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error: Error) => {
      // Handle specific error cases
      let message = error.message || 'Failed to publish announcement.';

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
    eventHash,
    previewEvent: unsignedEvent,
    timestamp,
    publish: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
    refreshTimestamp,
  };
}
