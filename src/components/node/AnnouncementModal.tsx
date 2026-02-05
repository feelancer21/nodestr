import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AnnouncementForm } from './AnnouncementForm';
import { useAnnouncementPublish, isValidZbase32 } from '@/hooks/useAnnouncementPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { verifyLightningSignature } from '@/lib/lnVerify';

interface AnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lightningPubkey: string;
  isRenew?: boolean;
}

export function AnnouncementModal({
  open,
  onOpenChange,
  lightningPubkey,
  isRenew = false,
}: AnnouncementModalProps) {
  const [signature, setSignature] = useState('');
  const [signatureError, setSignatureError] = useState<string | undefined>(undefined);
  const { user } = useCurrentUser();

  const {
    eventHash,
    previewEvent,
    publish,
    isPending,
    error,
    reset,
    refreshTimestamp,
  } = useAnnouncementPublish({ lightningPubkey });

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSignature('');
      setSignatureError(undefined);
      reset();
    }
  }, [open, reset]);

  // Refresh timestamp when modal opens
  useEffect(() => {
    if (open) {
      refreshTimestamp();
    }
  }, [open, refreshTimestamp]);

  // Validate signature on change
  const handleSignatureChange = useCallback((value: string) => {
    setSignature(value);

    // Clear error when empty
    if (!value.trim()) {
      setSignatureError(undefined);
      return;
    }

    // Validate zbase32 format
    if (!isValidZbase32(value.trim())) {
      setSignatureError('Invalid signature format. Please paste the zbase32 signature from your Lightning node.');
    } else {
      // zbase32 format OK, now verify cryptographically
      const verification = verifyLightningSignature(eventHash, value.trim(), lightningPubkey);
      if (!verification.valid) {
        setSignatureError(`Signature verification failed: ${verification.error}`);
      } else {
        setSignatureError(undefined);
      }
    }
  }, [eventHash, lightningPubkey]);

  // Build preview event that includes signature when entered
  const displayEvent = useMemo(() => {
    if (!previewEvent) return null;

    const trimmedSig = signature.trim();
    if (trimmedSig && !signatureError) {
      return {
        ...previewEvent,
        tags: [
          ...previewEvent.tags,
          ['sig', trimmedSig],
        ],
      };
    }

    return previewEvent;
  }, [previewEvent, signature, signatureError]);

  const handleSubmit = useCallback(async () => {
    const trimmedSig = signature.trim();

    if (!trimmedSig) {
      setSignatureError('Please enter a signature');
      return;
    }

    if (!isValidZbase32(trimmedSig)) {
      setSignatureError('Invalid signature format. Please paste the zbase32 signature from your Lightning node.');
      return;
    }

    try {
      await publish(trimmedSig);
    } catch {
      // Error is handled by the mutation onError callback
    }
  }, [signature, publish]);

  // Determine the error to display
  const displayError = signatureError || error?.message;

  // Only show form if user is logged in
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Please log in with your Nostr account to announce node ownership.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isRenew ? 'Renew Node Announcement' : 'Announce Node'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[75vh] px-1">
          {displayEvent && (
            <AnnouncementForm
              lightningPubkey={lightningPubkey}
              eventHash={eventHash}
              previewEvent={displayEvent}
              signature={signature}
              onSignatureChange={handleSignatureChange}
              onSubmit={handleSubmit}
              isSubmitting={isPending}
              error={displayError}
              signatureValid={!!signature.trim() && !signatureError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
