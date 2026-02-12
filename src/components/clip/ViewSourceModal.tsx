import { useState, useMemo } from 'react';
import { Code, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { CopyButton } from './CopyButton';
import type { NostrEvent } from '@nostrify/nostrify';
import { getEventHash } from 'nostr-tools';

interface ViewSourceModalProps {
  event: NostrEvent;
}

function getClipKind(event: NostrEvent): string | null {
  const kTag = event.tags.find(t => t[0] === 'k');
  return kTag?.[1] ?? null;
}

function getLightningPubkey(event: NostrEvent): string | null {
  const kTag = event.tags.find(t => t[0] === 'k');
  const dTag = event.tags.find(t => t[0] === 'd');

  if (!kTag || !dTag) return null;

  // For k=0 (Node Announcement), d-tag is the Lightning pubkey
  if (kTag[1] === '0') {
    return dTag[1] ?? null;
  }

  // For k=1 (Node Info), d-tag format is "1:<lightning-pubkey>:<network>"
  if (kTag[1] === '1') {
    const parts = dTag[1]?.split(':');
    if (parts && parts.length >= 2) {
      return parts[1];
    }
  }

  return null;
}

function getClipSignature(event: NostrEvent): string | null {
  const sigTag = event.tags.find(t => t[0] === 'sig');
  return sigTag?.[1] ?? null;
}

/**
 * Compute the CLIP hash (event ID without sig tags)
 * This mirrors the Go reference: event.Hash() = event.copyWithoutSig().GetID()
 */
function computeClipHash(event: NostrEvent): string {
  // Remove sig tags from the event
  const filteredTags = event.tags.filter(tag => tag[0] !== 'sig');

  // Create event without sig tags
  // Add empty id and sig fields to satisfy NostrEvent type (not used by getEventHash)
  const eventWithoutSig = {
    id: '',
    sig: '',
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: filteredTags,
    content: event.content,
  };

  // Use nostr-tools getEventHash which implements NIP-01:
  // SHA256(JSON.stringify([0, pubkey, created_at, kind, tags, content]))
  return getEventHash(eventWithoutSig as NostrEvent);
}

export function ViewSourceModal({ event }: ViewSourceModalProps) {
  const [open, setOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const jsonString = JSON.stringify(event, null, 2);

  const clipKind = getClipKind(event);
  const isAnnouncement = clipKind === '0';
  const lightningPubkey = isAnnouncement ? getLightningPubkey(event) : null;
  const clipSignature = isAnnouncement ? getClipSignature(event) : null;

  // Compute CLIP hash (event ID without sig tags)
  const clipHash = useMemo(() => {
    if (!isAnnouncement) return null;
    return computeClipHash(event);
  }, [event, isAnnouncement]);

  const verifyCommand = clipHash && clipSignature
    ? `lncli verifymessage --msg "${clipHash}" --sig "${clipSignature}"`
    : null;

  const hashCommand = useMemo(() => {
    if (!isAnnouncement) return null;
    const filteredTags = event.tags.filter(tag => tag[0] !== 'sig');
    const serialized = JSON.stringify([0, event.pubkey, event.created_at, event.kind, filteredTags, event.content]);
    return `printf '${serialized}' | sha256sum`;
  }, [event, isAnnouncement]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition"
          title="View Source"
        >
          <Code className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Event Source</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0">
          <div className="flex justify-end mb-2">
            <CopyButton value={jsonString} />
          </div>
          <div className="bg-muted rounded-lg p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground">
              {jsonString}
            </pre>
          </div>

          {/* Don't Trust, Verify Section - only for Node Announcements */}
          {isAnnouncement && lightningPubkey && clipHash && (
            <Collapsible open={verifyOpen} onOpenChange={setVerifyOpen} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  Don't Trust, Verify
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${verifyOpen ? 'rotate-90' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Optionally verify this announcement manually using your Lightning node CLI.
                  </p>

                  <div>
                    <span className="text-xs text-label">Lightning Hash (Event ID without sig tags)</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono text-foreground break-all flex-1 bg-background p-2 rounded">
                        {clipHash}
                      </code>
                      <CopyButton value={clipHash} />
                    </div>
                  </div>

                  {clipSignature && (
                    <div>
                      <span className="text-xs text-label">Lightning Signature (sig tag)</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono text-foreground break-all flex-1 bg-background p-2 rounded">
                          {clipSignature}
                        </code>
                        <CopyButton value={clipSignature} />
                      </div>
                    </div>
                  )}

                  {hashCommand && (
                    <div>
                      <span className="text-xs text-label">Hash Verification (Linux)</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono text-foreground break-all flex-1 bg-background p-2 rounded">
                          {hashCommand}
                        </code>
                        <CopyButton value={hashCommand} />
                      </div>
                    </div>
                  )}

                  {verifyCommand && (
                    <div>
                      <span className="text-xs text-label">Verify Command (LND)</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono text-foreground break-all flex-1 bg-background p-2 rounded">
                          {verifyCommand}
                        </code>
                        <CopyButton value={verifyCommand} />
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-3">
                    <span className="text-xs text-label">Expected Result</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      If the signature is valid, the command will return the Lightning node pubkey:
                    </p>
                    <code className="text-xs font-mono text-foreground break-all block bg-background p-2 rounded mt-1">
                      {lightningPubkey}
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: LND may return <code className="text-xs">valid: false</code> if the node is not in your local graph.
                      This is expected for nodes you're not connected to. The important part is that the <code className="text-xs">pubkey</code> matches.
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
