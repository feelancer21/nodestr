import type { NostrEvent } from '@nostrify/nostrify';
import type { ClipIdentifier, ClipKind } from '@/lib/clip';
import { CLIP_ANNOUNCEMENT } from '@/lib/clip';

interface AnnouncementState {
  createdAt: number;
  pubkey: string;
}

interface NodeState {
  lastAnnouncement?: AnnouncementState;
  events: Map<string, ClipStoredEvent>;
}

export interface ClipStoredEvent {
  event: NostrEvent;
  identifier: ClipIdentifier;
}

export class ClipStore {
  private records = new Map<string, NodeState>();

  store(event: ClipStoredEvent): { stored: boolean; reason?: string } {
    const { identifier } = event;
    const nodeState = this.getNodeState(identifier.pubkey);

    if (identifier.kind === CLIP_ANNOUNCEMENT) {
      const reason = this.storeAnnouncement(nodeState, event);
      return reason ? { stored: false, reason } : { stored: true };
    }

    const reason = this.storeRegularEvent(nodeState, event);
    return reason ? { stored: false, reason } : { stored: true };
  }

  getEvents(kind?: ClipKind): ClipStoredEvent[] {
    const results: ClipStoredEvent[] = [];
    for (const nodeState of this.records.values()) {
      for (const stored of nodeState.events.values()) {
        if (kind !== undefined && stored.identifier.kind !== kind) continue;
        results.push(stored);
      }
    }
    return results;
  }

  private storeAnnouncement(nodeState: NodeState, stored: ClipStoredEvent) {
    const createdAt = stored.event.created_at;
    const current = nodeState.lastAnnouncement;

    if (current && current.createdAt >= createdAt) {
      return 'announcement_older_or_equal';
    }

    if (current && current.pubkey !== stored.event.pubkey) {
      nodeState.events.clear();
    }

    nodeState.events.set(stored.identifier.tagD, stored);
    nodeState.lastAnnouncement = {
      createdAt,
      pubkey: stored.event.pubkey,
    };

    return undefined;
  }

  private storeRegularEvent(nodeState: NodeState, stored: ClipStoredEvent) {
    const announcement = nodeState.lastAnnouncement;
    if (!announcement) return 'missing_announcement';

    if (announcement.pubkey !== stored.event.pubkey) {
      return 'announcement_pubkey_mismatch';
    }

    const existing = nodeState.events.get(stored.identifier.tagD);
    if (existing && existing.event.created_at >= stored.event.created_at) {
      return 'record_older_or_equal';
    }

    nodeState.events.set(stored.identifier.tagD, stored);
    return undefined;
  }

  private getNodeState(pubkey: string): NodeState {
    const existing = this.records.get(pubkey);
    if (existing) return existing;

    const nodeState: NodeState = { events: new Map() };
    this.records.set(pubkey, nodeState);
    return nodeState;
  }
}
