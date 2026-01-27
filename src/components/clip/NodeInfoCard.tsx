import type { NostrEvent } from '@nostrify/nostrify';
import type { ClipIdentifier } from '@/lib/clip';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader as UICardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardHeader } from './CardHeader';
import { CopyButton } from './CopyButton';
import { NodeInfoContent } from './NodeInfoContent';
import { ViewSourceModal } from './ViewSourceModal';
import { getNetworkBadgeColor, getMempoolNodeUrl } from '@/lib/utils';

interface NodeInfoCardProps {
  event: NostrEvent;
  identifier: ClipIdentifier;
  content: unknown;
  onClick?: () => void;
}

export function NodeInfoCard({ event, identifier, content, onClick }: NodeInfoCardProps) {
  const network = identifier.network || 'unknown';
  const mempoolUrl = getMempoolNodeUrl(identifier.pubkey, network);
  const lightningPubkeyShort = `${identifier.pubkey.slice(0, 6)}...${identifier.pubkey.slice(-6)}`;
  const nodeAlias = identifier.pubkey.slice(0, 20);

  const parsedContent = typeof content === 'object' && content !== null ? content : {};

  return (
    <Card
      className="border-border bg-card text-card-foreground cursor-pointer hover:bg-accent/50 transition overflow-hidden"
      onClick={(e) => {
        // Don't navigate if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
          return;
        }
        onClick?.();
      }}
    >
      <UICardHeader className="pb-3">
        <CardHeader
          pubkey={event.pubkey}
          createdAt={event.created_at}
          onClick={onClick}
        />
      </UICardHeader>

      <CardContent>
        {/* Badges row */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Node Info
          </Badge>
          <Badge variant="secondary" className={getNetworkBadgeColor(network)}>
            {network}
          </Badge>
        </div>

        {/* Node identity row */}
        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground truncate">
              {nodeAlias}
            </p>
          </div>
          {mempoolUrl ? (
            <a
              href={mempoolUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground transition shrink-0"
              title="View on mempool.space"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground/50 cursor-not-allowed shrink-0"
              title="Not available yet"
              disabled
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Lightning pubkey row */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground font-mono">
            {lightningPubkeyShort}
          </span>
          <CopyButton value={identifier.pubkey} />
        </div>

        {/* Node Info content */}
        <div className="mt-4">
          <NodeInfoContent content={parsedContent} />
        </div>

        {/* View Source - bottom right */}
        <div className="flex justify-end mt-4">
          <ViewSourceModal event={event} />
        </div>
      </CardContent>
    </Card>
  );
}
