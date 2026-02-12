import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DMConversationList } from '@/components/dm/DMConversationList';
import { DMChatArea } from '@/components/dm/DMChatArea';
import { DMStatusInfo } from '@/components/dm/DMStatusInfo';
import { useDMContext } from '@/hooks/useDMContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import { loadDrafts, saveDrafts } from '@/lib/dmUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DMMessagingInterfaceProps {
  className?: string;
}

export const DMMessagingInterface = ({ className }: DMMessagingInterfaceProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPubkey = searchParams.get('to');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { clearCacheAndRefetch } = useDMContext();
  const [drafts, setDrafts] = useState<Map<string, string>>(() => loadDrafts());

  // Persist drafts to sessionStorage whenever they change
  useEffect(() => {
    saveDrafts(drafts);
  }, [drafts]);

  // On mobile, show only one panel at a time
  const showConversationList = !isMobile || !selectedPubkey;
  const showChatArea = !isMobile || !!selectedPubkey;

  const handleSelectConversation = useCallback((pubkey: string) => {
    setSearchParams({ to: pubkey }, { replace: false });
  }, [setSearchParams]);

  return (
    <>
      {/* Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Messaging Status</DialogTitle>
            <DialogDescription>
              View loading status, cache info, and connection details
            </DialogDescription>
          </DialogHeader>
          <DMStatusInfo clearCacheAndRefetch={clearCacheAndRefetch} />
        </DialogContent>
      </Dialog>

      <div className={cn('flex gap-4 overflow-hidden', className)}>
        {/* Conversation List */}
        <div className={cn(
          'w-80 flex-shrink-0',
          isMobile && !showConversationList && 'hidden',
          isMobile && showConversationList && 'w-full'
        )}>
          <DMConversationList
            selectedPubkey={selectedPubkey}
            onSelectConversation={handleSelectConversation}
            className="h-full"
            onStatusClick={() => setStatusModalOpen(true)}
            drafts={drafts}
          />
        </div>

        {/* Chat Area */}
        <div className={cn(
          'flex-1 min-w-0',
          isMobile && !showChatArea && 'hidden',
          isMobile && selectedPubkey && 'w-full'
        )}>
          <DMChatArea
            pubkey={selectedPubkey}
            isMobile={isMobile}
            className="h-full"
            onDraftsChange={setDrafts}
          />
        </div>
      </div>
    </>
  );
};
