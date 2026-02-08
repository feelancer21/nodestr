import { useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NodeInfoForm } from './NodeInfoForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNodeInfoPublish } from '@/hooks/useNodeInfoPublish';
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
  const { publish, isPending, error, reset } = useNodeInfoPublish({
    lightningPubkey,
    network,
  });

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

  // Handle submit — mirrors the working AnnouncementModal pattern:
  // async wrapper with try/catch around mutateAsync
  const handleSubmit = useCallback(
    async (payload: NodeInfoPayload) => {
      try {
        await publish(payload);
      } catch {
        // Error is handled by the mutation onError callback
      }
    },
    [publish]
  );

  // Reset hook state when modal closes
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

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
            isSubmitting={isPending}
            error={error?.message}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
