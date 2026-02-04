import { useState } from 'react';
import { ChevronRight, Loader2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CopyButton } from '@/components/clip/CopyButton';

interface AnnouncementFormProps {
  lightningPubkey: string;
  eventHash: string;
  previewEvent: {
    kind: number;
    pubkey: string;
    created_at: number;
    tags: string[][];
    content: string;
  };
  signature: string;
  onSignatureChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string;
}

function truncateLnPub(pubkey: string): string {
  return `${pubkey.slice(0, 12)}...${pubkey.slice(-8)}`;
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 16)}...${hash.slice(-12)}`;
}

export function AnnouncementForm({
  lightningPubkey,
  eventHash,
  previewEvent,
  signature,
  onSignatureChange,
  onSubmit,
  isSubmitting,
  error,
}: AnnouncementFormProps) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const jsonString = JSON.stringify(previewEvent, null, 2);

  return (
    <div className="space-y-4">
      {/* Lightning Node Pubkey */}
      <div>
        <span className="text-xs text-label">Lightning Node</span>
        <div className="flex items-center gap-1 mt-1 min-w-0">
          {/* Full pubkey on desktop */}
          <span className="hidden md:inline text-sm font-mono text-foreground break-all">
            {lightningPubkey}
          </span>
          {/* Truncated on mobile */}
          <span className="inline md:hidden text-sm font-mono text-foreground">
            {truncateLnPub(lightningPubkey)}
          </span>
          <CopyButton value={lightningPubkey} />
        </div>
      </div>

      {/* Step 1: Sign hash */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-label">Step 1: Sign this hash with your Lightning node</span>
          <button
            onClick={() => setHelpOpen(!helpOpen)}
            className="text-muted-foreground hover:text-foreground"
            title="Show signing help"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1 mt-1 min-w-0">
          {/* Full hash on desktop */}
          <span className="hidden md:inline text-sm font-mono text-foreground break-all">
            {eventHash}
          </span>
          {/* Truncated on mobile */}
          <span className="inline md:hidden text-sm font-mono text-foreground">
            {truncateHash(eventHash)}
          </span>
          <CopyButton value={eventHash} />
        </div>
        {helpOpen && (
          <div className="mt-2 p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-foreground break-all flex-1">
                lncli signmessage "{eventHash}"
              </code>
              <CopyButton value={`lncli signmessage "${eventHash}"`} />
            </div>
            <p className="text-xs text-muted-foreground">
              This command is for LND only. For CLN or Eclair, refer to their documentation.
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Paste signature */}
      <div className="border-t border-border pt-4">
        <span className="text-xs text-label">Step 2: Paste your Lightning signature</span>
        <Textarea
          value={signature}
          onChange={(e) => onSignatureChange(e.target.value)}
          placeholder="Paste zbase32 signature here..."
          className="mt-1 font-mono text-sm"
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      {/* Collapsible Event JSON */}
      <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
          >
            View Event JSON
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform ${jsonOpen ? 'rotate-90' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="bg-muted rounded-lg p-4 overflow-auto max-h-64">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground">
              {jsonString}
            </pre>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="border-t border-border pt-4">
        <Button
          onClick={onSubmit}
          disabled={!signature.trim() || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish Announcement'
          )}
        </Button>
      </div>
    </div>
  );
}
