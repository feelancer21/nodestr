import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NodeInfoForm } from './NodeInfoForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import type { Network } from '@/types/search';

interface NodeInfoPayload {
  about?: string;
  min_channel_size_sat?: number;
  max_channel_size_sat?: number;
  contact_info?: Array<{
    type: string;
    value: string;
    note?: string;
    primary?: boolean;
  }>;
  custom_records?: Record<string, string>;
}

interface NodeInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lightningPubkey: string;
  network: Network;
  existingContent?: unknown;
}

export function NodeInfoModal({
  open,
  onOpenChange,
  lightningPubkey,
  network,
  existingContent,
}: NodeInfoModalProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Parse existing content as initial data
  const initialData: NodeInfoPayload | undefined = (() => {
    if (!existingContent) return undefined;
    try {
      if (typeof existingContent === 'string') {
        return JSON.parse(existingContent) as NodeInfoPayload;
      }
      return existingContent as NodeInfoPayload;
    } catch {
      return undefined;
    }
  })();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setError(undefined);
    }
  }, [open]);

  // Handle submit (design phase mock)
  const handleSubmit = useCallback(
    async (payload: NodeInfoPayload) => {
      setError(undefined);
      setIsSubmitting(true);

      // Mock submission for design phase
      console.log('NodeInfoModal: Mock publish', {
        lightningPubkey,
        network,
        payload,
      });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setIsSubmitting(false);

      // Show success toast
      toast({
        title: 'Success',
        description: 'Node Info published successfully.',
      });

      // Close modal
      onOpenChange(false);
    },
    [lightningPubkey, network, onOpenChange, toast]
  );

  // Login guard
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Please log in with your Nostr account to publish Node Info.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {existingContent ? 'Edit Node Info' : 'Add Node Info'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[75vh] px-1">
          <NodeInfoForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
