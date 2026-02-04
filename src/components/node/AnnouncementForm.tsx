import { useState } from 'react';
import { ChevronRight, Loader2, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CopyButton } from '@/components/clip/CopyButton';
import { cn } from '@/lib/utils';

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
  signatureValid?: boolean;
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
  signatureValid,
}: AnnouncementFormProps) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const jsonString = JSON.stringify(previewEvent, null, 2);

  // Determine signature input state for styling
  const hasSignature = signature.trim().length > 0;
  const showValidIcon = hasSignature && signatureValid;
  const showErrorIcon = hasSignature && !signatureValid;

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
            <p className="text-xs text-muted-foreground mb-2">
              Sign this hash with your Lightning node to prove ownership:
            </p>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-label">LND:</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono text-foreground break-all flex-1 bg-background p-2 rounded">
                    lncli signmessage "{eventHash}"
                  </code>
                  <CopyButton value={`lncli signmessage "${eventHash}"`} />
                </div>
              </div>
              <div>
                <span className="text-xs text-label">Core Lightning (CLN):</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono text-foreground break-all flex-1 bg-background p-2 rounded">
                    lightning-cli signmessage "{eventHash}"
                  </code>
                  <CopyButton value={`lightning-cli signmessage "${eventHash}"`} />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              The signature will be in zbase32 format. Copy the entire signature value.
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Paste signature */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-label">Step 2: Paste your Lightning signature</span>
          {showValidIcon && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Valid format
            </span>
          )}
          {showErrorIcon && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              Invalid format
            </span>
          )}
        </div>
        <Textarea
          value={signature}
          onChange={(e) => onSignatureChange(e.target.value)}
          placeholder="Paste zbase32 signature here..."
          className={cn(
            'mt-1 font-mono text-sm',
            showValidIcon && 'border-emerald-500 focus-visible:ring-emerald-500',
            showErrorIcon && 'border-destructive focus-visible:ring-destructive'
          )}
          rows={2}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          The signature should contain only zbase32 characters (letters and numbers, no special characters).
        </p>
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
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="border-t border-border pt-4">
        <Button
          onClick={onSubmit}
          disabled={!signatureValid || isSubmitting}
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
