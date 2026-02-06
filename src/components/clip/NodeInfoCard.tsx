import { Link } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import type { ClipIdentifier } from '@/lib/clip';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader as UICardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardHeader } from './CardHeader';
import { NodeInfoContent } from './NodeInfoContent';
import { ViewSourceModal } from './ViewSourceModal';
import { getNetworkBadgeColor, getMempoolNodeUrl } from '@/lib/utils';
import { useNodeAlias } from '@/hooks/useNodeAlias';

interface NodeInfoCardProps {
  event: NostrEvent;
  identifier: ClipIdentifier;
  content: unknown;
  onClick?: () => void;
}

export function NodeInfoCard({ event, identifier, content, onClick }: NodeInfoCardProps) {
  const network = identifier.network || 'unknown';
  const mempoolUrl = getMempoolNodeUrl(identifier.pubkey, network);

  const nodeData = useNodeAlias(identifier.pubkey, network);

  const parsedContent = typeof content === 'object' && content !== null ? content : {};

  return (
    <Card
      className={`border-border bg-card text-card-foreground transition overflow-hidden ${
        onClick ? 'cursor-pointer hover:bg-accent/50' : ''
      }`}
      onClick={(e) => {
        if (!onClick) return;
        // Don't navigate if user is selecting text
        const selection = window.getSelection()?.toString();
        if (selection) return;
        // Don't navigate if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
          return;
        }
        onClick();
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
            <Link
              to={`/lightning/${network}/node/${identifier.pubkey}`}
              className="text-base font-semibold text-foreground hover:underline truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {nodeData.alias}
            </Link>
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

        {/* Capacity + Channels */}
        {(nodeData.capacity != null || nodeData.channels != null) && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3">
            {nodeData.capacity != null && (
              <div>
                <span className="text-xs text-label">Capacity</span>
                <p className="text-sm font-medium text-foreground">
                  {nodeData.capacity.toLocaleString()} sats
                </p>
              </div>
            )}
            {nodeData.channels != null && (
              <div>
                <span className="text-xs text-label">Channels</span>
                <p className="text-sm font-medium text-foreground">
                  {nodeData.channels.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Node Info content */}
        <div className="border-t border-border mt-4 pt-4">
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
