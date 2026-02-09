import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/clip/CopyButton';
import type { NostrEvent } from '@nostrify/nostrify';
import { cn } from '@/lib/utils';

interface DMViewSourceModalProps {
  /** The stored event: kind 4 (NIP-04, encrypted content) or kind 13 (NIP-17 seal, encrypted content) */
  storedEvent: NostrEvent;
  /** The decrypted inner event for NIP-17 (kind 14/15 rumor with plaintext) */
  decryptedEvent?: NostrEvent;
  /** Gift wrap event ID for NIP-17 */
  originalGiftWrapId?: string;
  /** Whether the bubble is from the current user (affects icon color) */
  isFromMe: boolean;
}

function getProtocol(event: NostrEvent, originalGiftWrapId?: string): 'NIP-04' | 'NIP-17' {
  if (originalGiftWrapId || event.kind === 13) return 'NIP-17';
  return 'NIP-04';
}

export function DMViewSourceModal({ storedEvent, decryptedEvent, originalGiftWrapId, isFromMe }: DMViewSourceModalProps) {
  const [open, setOpen] = useState(false);
  const protocol = getProtocol(storedEvent, originalGiftWrapId);

  // storedEvent is the raw event with encrypted content (seal or kind 4)
  const sealJson = JSON.stringify(storedEvent, null, 2);

  // decryptedEvent is the inner rumor (kind 14/15) with plaintext content
  const innerJson = decryptedEvent ? JSON.stringify(decryptedEvent, null, 2) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center transition opacity-50 hover:opacity-100',
            isFromMe ? 'text-white' : 'text-muted-foreground'
          )}
          title={protocol}
        >
          {protocol === 'NIP-17' ? (
            <ShieldCheck className="h-3 w-3" />
          ) : (
            <Lock className="h-3 w-3" />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Message Source
            <Badge variant={protocol === 'NIP-17' ? 'default' : 'secondary'} className="text-xs">
              {protocol}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0 space-y-4">
          {/* Protocol Info */}
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-label">Protocol</span>
              <span className="text-xs text-foreground">
                {protocol === 'NIP-17'
                  ? 'Private Direct Message (NIP-17) — 3-layer encryption'
                  : 'Direct Message (NIP-04) — legacy encryption'}
              </span>
            </div>
            {protocol === 'NIP-17' && (
              <p className="text-xs text-muted-foreground">
                Gift Wrap (kind 1059) → Seal (kind 13) → Message (kind 14)
              </p>
            )}
          </div>

          {/* NIP-17: Decrypted inner message (kind 14/15 rumor) */}
          {protocol === 'NIP-17' && innerJson && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-label">Decrypted Message (kind {decryptedEvent?.kind})</span>
                <CopyButton value={innerJson} />
              </div>
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground">
                  {innerJson}
                </pre>
              </div>
            </div>
          )}

          {/* Seal (kind 13, encrypted content) or NIP-04 Event (kind 4, encrypted content) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-label">
                {protocol === 'NIP-17' ? `Seal (kind ${storedEvent.kind})` : `Encrypted Event (kind ${storedEvent.kind})`}
              </span>
              <CopyButton value={sealJson} />
            </div>
            <div className="bg-muted rounded-lg p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground">
                {sealJson}
              </pre>
            </div>
          </div>

          {/* Gift Wrap ID */}
          {originalGiftWrapId && !originalGiftWrapId.startsWith('optimistic') && (
            <div>
              <span className="text-xs text-label">Gift Wrap ID</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs font-mono text-foreground break-all flex-1 bg-muted p-2 rounded">
                  {originalGiftWrapId}
                </code>
                <CopyButton value={originalGiftWrapId} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
