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

  store(event: ClipStoredEvent) {
    const { identifier } = event;
    const nodeState = this.getNodeState(identifier.pubkey);

    if (identifier.kind === CLIP_ANNOUNCEMENT) {
      this.storeAnnouncement(nodeState, event);
      return;
    }

    this.storeRegularEvent(nodeState, event);
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
      return;
    }

    if (current && current.pubkey !== stored.event.pubkey) {
      nodeState.events.clear();
    }

    nodeState.events.set(stored.identifier.tagD, stored);
    nodeState.lastAnnouncement = {
      createdAt,
      pubkey: stored.event.pubkey,
    };
  }

  private storeRegularEvent(nodeState: NodeState, stored: ClipStoredEvent) {
    const announcement = nodeState.lastAnnouncement;
    if (!announcement) return;

    if (announcement.pubkey !== stored.event.pubkey) {
      return;
    }

    const existing = nodeState.events.get(stored.identifier.tagD);
    if (existing && existing.event.created_at >= stored.event.created_at) {
      return;
    }

    nodeState.events.set(stored.identifier.tagD, stored);
  }

  private getNodeState(pubkey: string): NodeState {
    const existing = this.records.get(pubkey);
    if (existing) return existing;

    const nodeState: NodeState = { events: new Map() };
    this.records.set(pubkey, nodeState);
    return nodeState;
  }
}
