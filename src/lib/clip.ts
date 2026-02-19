import { getEventHash, verifyEvent } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { verifyLightningSignature } from '@/lib/lnVerify';

export const CLIP_KIND = 38171;
export type ClipKind = 0 | 1;

export const CLIP_ANNOUNCEMENT = 0 as ClipKind;
export const CLIP_NODE_INFO = 1 as ClipKind;

export const MAX_CONTENT_BYTES = 1024 * 1024;
export const EVENT_GRACE_SECONDS = 600;

const NETWORK_ALLOW_LIST = new Set([
  'mainnet',
  'testnet',
  'testnet4',
  'signet',
  'simnet',
  'regtest',
]);

const ZBASE32_REGEX = /^[ybndrfg8ejkmcpqxot1uwisza345h769]+$/i;

export interface ClipIdentifier {
  tagD: string;
  kind: ClipKind;
  pubkey: string;
  network?: string;
  opts: string[];
}

export interface ClipVerifiedEvent {
  event: NostrEvent;
  identifier: ClipIdentifier;
}

export function isValidNetwork(network: string | undefined): boolean {
  if (!network) return false;
  return NETWORK_ALLOW_LIST.has(network);
}

function getTagValue(tags: string[][], name: string): string | undefined {
  const tag = tags.find(([tagName]) => tagName === name);
  return tag?.[1];
}

function getAllTagValues(tags: string[][], name: string): string[] {
  return tags.filter(([tagName]) => tagName === name).map(([, value]) => value).filter(Boolean);
}

export function parseIdentifier(event: NostrEvent): ClipIdentifier {
  const tagD = getTagValue(event.tags ?? [], 'd');
  const tagK = getTagValue(event.tags ?? [], 'k');

  if (!tagD) {
    throw new Error("missing 'd' tag");
  }

  if (!tagK) {
    throw new Error("missing 'k' tag");
  }

  const kindInt = Number(tagK);
  if (!Number.isInteger(kindInt)) {
    throw new Error("invalid 'k' tag");
  }

  if (kindInt !== CLIP_ANNOUNCEMENT && kindInt !== CLIP_NODE_INFO) {
    throw new Error('unsupported CLIP kind');
  }

  const kind = kindInt as ClipKind;

  if (kind === CLIP_ANNOUNCEMENT) {
    return {
      tagD,
      kind,
      pubkey: tagD,
      opts: [],
    };
  }

  const parts = tagD.split(':');
  if (parts.length < 3) {
    throw new Error("invalid 'd' tag format");
  }

  return {
    tagD,
    kind,
    pubkey: parts[1],
    network: parts[2],
    opts: parts.slice(3),
  };
}

function hasValidSignature(event: NostrEvent): boolean {
  try {
    return verifyEvent(event);
  } catch {
    return false;
  }
}

function hasValidEventId(event: NostrEvent): boolean {
  try {
    return getEventHash(event) === event.id;
  } catch {
    return false;
  }
}

function contentSizeWithinLimit(content: string): boolean {
  return new TextEncoder().encode(content).length <= MAX_CONTENT_BYTES;
}

/**
 * Computes the event hash (ID) for an event with all 'sig' tags removed.
 * This matches the Go reference: event.copyWithoutSig().GetID()
 */
function computeEventHashWithoutSigTag(event: NostrEvent): string {
  const filteredTags = (event.tags ?? []).filter(tag => tag[0] !== 'sig');
  const copy = { ...event, tags: filteredTags };
  return getEventHash(copy);
}

/**
 * Full cryptographic verification of a Lightning signature on a Node Announcement (k=0).
 * Replaces the previous regex-only check with secp256k1 signature recovery and pubkey comparison.
 *
 * Matches Go reference: event.go Verify() → checkLightningSig() → Hash() → zbase32 decode →
 * double SHA256 → RecoverCompact → pubkey compare
 */
function verifyAnnouncementLightningSignature(
  event: NostrEvent,
  identifier: ClipIdentifier,
): { valid: boolean; error?: string } {
  const sigs = getAllTagValues(event.tags ?? [], 'sig');
  if (sigs.length !== 1) {
    return { valid: false, error: `expected exactly 1 sig tag, got ${sigs.length}` };
  }

  const sig = sigs[0];
  if (!ZBASE32_REGEX.test(sig)) {
    return { valid: false, error: 'sig tag is not valid zbase32' };
  }

  const eventHash = computeEventHashWithoutSigTag(event);
  return verifyLightningSignature(eventHash, sig, identifier.pubkey);
}

export function verifyClipEvent(event: NostrEvent, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (event.kind !== CLIP_KIND) {
    return { ok: false, reason: 'not a CLIP event' };
  }

  if (event.created_at > nowSeconds + EVENT_GRACE_SECONDS) {
    return { ok: false, reason: 'event is too far in the future' };
  }

  if (!hasValidEventId(event)) {
    return { ok: false, reason: 'event id mismatch' };
  }

  if (!contentSizeWithinLimit(event.content ?? '')) {
    return { ok: false, reason: 'content too large' };
  }

  let identifier: ClipIdentifier;
  try {
    identifier = parseIdentifier(event);
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }

  if (identifier.kind !== CLIP_ANNOUNCEMENT && !isValidNetwork(identifier.network)) {
    return { ok: false, reason: 'invalid network' };
  }

  if (!hasValidSignature(event)) {
    return { ok: false, reason: 'invalid nostr signature' };
  }

  if (identifier.kind === CLIP_ANNOUNCEMENT) {
    const lnSigResult = verifyAnnouncementLightningSignature(event, identifier);
    if (!lnSigResult.valid) {
      return { ok: false, reason: lnSigResult.error || 'invalid lightning signature' };
    }
  }

  return { ok: true, identifier } as const;
}
