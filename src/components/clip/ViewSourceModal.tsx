import { useState } from 'react';
import { Code } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CopyButton } from './CopyButton';
import type { NostrEvent } from '@nostrify/nostrify';

interface ViewSourceModalProps {
  event: NostrEvent;
}

export function ViewSourceModal({ event }: ViewSourceModalProps) {
  const [open, setOpen] = useState(false);
  const jsonString = JSON.stringify(event, null, 2);

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Event Source</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end -mt-2 mb-2">
          <CopyButton value={jsonString} />
        </div>
        <div className="overflow-auto max-h-[60vh] bg-muted rounded-lg p-4">
          <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground">
            {jsonString}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
