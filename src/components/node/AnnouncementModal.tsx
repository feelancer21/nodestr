import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AnnouncementForm } from './AnnouncementForm';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSignature('');
      setIsSubmitting(false);
      setError(undefined);
    }
  }, [open]);

  // Mock data
  const mockEventHash = 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890';

  // Computed preview event that updates with signature
  const previewEvent = {
    kind: 38171,
    pubkey: 'placeholder_nostr_pubkey_hex',
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', lightningPubkey],
      ['k', '0'],
      ...(signature.trim() ? [['sig', signature.trim()]] : []),
    ],
    content: '{}',
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setError(undefined);

    // Mock submit with 2 second delay
    setTimeout(() => {
      setIsSubmitting(false);
      setError('Mock error: Publishing not implemented in design phase');
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isRenew ? 'Renew Node Announcement' : 'Announce Node Ownership'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[75vh] px-1">
          <AnnouncementForm
            lightningPubkey={lightningPubkey}
            eventHash={mockEventHash}
            previewEvent={previewEvent}
            signature={signature}
            onSignatureChange={setSignature}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
