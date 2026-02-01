import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CopyButton } from '@/components/clip/CopyButton';
import { cn, formatRelativeTime, pubkeyToColor } from '@/lib/utils';
import { genUserName } from '@/lib/genUserName';
import type { MempoolNode, Network, OperatorInfo } from '@/types/search';

interface NodeBannerProps {
  node: MempoolNode;
  network: Network;
  operator: OperatorInfo;
}

function formatCapacitySats(satoshis: number | null | undefined): string {
  if (satoshis == null) return '—';
  return satoshis.toLocaleString() + ' sats';
}

function truncateLnPub(pubkey: string): string {
  return `${pubkey.slice(0, 12)}...${pubkey.slice(-8)}`;
}

function getNetworkBadgeClasses(network: Network): string {
  switch (network) {
    case 'mainnet':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
    case 'testnet':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-200';
    case 'signet':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getMempoolUrl(pubkey: string, network: Network): string {
  const base = 'https://mempool.space';
  switch (network) {
    case 'testnet':
      return `${base}/testnet/lightning/node/${pubkey}`;
    case 'signet':
      return `${base}/signet/lightning/node/${pubkey}`;
    default:
      return `${base}/lightning/node/${pubkey}`;
  }
}

export function NodeBanner({ node, network, operator }: NodeBannerProps) {
  const isOffline = node.status === 0;
  const mempoolUrl = getMempoolUrl(node.public_key, network);

  // Use genUserName as fallback when no name is available
  const operatorDisplayName = operator.name || (operator.pubkey ? genUserName(operator.pubkey) : 'Anonymous');

  const operatorInitials = operatorDisplayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Generate avatar color from pubkey (consistent with CardHeader pattern)
  const avatarColor = operator.pubkey ? pubkeyToColor(operator.pubkey) : undefined;

  const lastAnnouncementTooltip = operator.lastAnnouncement
    ? new Date(operator.lastAnnouncement * 1000).toLocaleString()
    : undefined;

  return (
    <div className={cn('rounded-3xl border border-border overflow-hidden', isOffline && 'opacity-75')}>
      {/* Banner gradient area */}
      <div className="h-32 relative bg-gradient-to-br from-amber-100 via-slate-50 to-white dark:from-amber-500/20 dark:via-slate-900/80 dark:to-slate-950" />

      {/* Content area */}
      <div className="relative px-6 sm:px-8 pb-6 pt-4 bg-card">
        {/* Alias and Network Badge - always on same line */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground truncate min-w-0 flex-1">
            {node.alias}
          </h1>
          <Badge className={cn('text-xs shrink-0', getNetworkBadgeClasses(network))}>
            {network}
          </Badge>
        </div>

        {/* Lightning Pubkey - shortened like npub */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs font-mono text-muted-foreground">
            {truncateLnPub(node.public_key)}
          </span>
          <CopyButton value={node.public_key} />
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-6 mt-4">
          <div>
            <span className="text-xs text-label">Capacity</span>
            <p className="text-sm font-medium text-foreground">
              {formatCapacitySats(node.capacity)}
            </p>
          </div>
          <div>
            <span className="text-xs text-label">Channels</span>
            <p className="text-sm font-medium text-foreground">
              {node.channels?.toLocaleString() ?? '—'}
            </p>
          </div>
          <div className="ml-auto">
            <a
              href={mempoolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition"
              title="View on mempool.space"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Operator section - integrated in banner */}
        {operator.hasAnnouncement ? (
          <div className="border-t border-border mt-4 pt-4">
            <a
              href={operator.pubkey ? `/profile/${operator.pubkey}` : undefined}
              className={cn(
                'flex items-center gap-3',
                operator.pubkey && 'hover:opacity-80 transition-opacity'
              )}
            >
              <Avatar className="h-10 w-10">
                {operator.picture ? (
                  <AvatarImage src={operator.picture} alt={operator.name || 'Operator'} />
                ) : null}
                <AvatarFallback
                  style={avatarColor ? { backgroundColor: avatarColor } : undefined}
                  className="text-white font-bold text-sm"
                >
                  {operatorInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-label">Operator</span>
                  {operator.lastAnnouncement && (
                    <span
                      className="text-xs text-muted-foreground"
                      title={lastAnnouncementTooltip}
                    >
                      {formatRelativeTime(operator.lastAnnouncement)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground truncate">
                  {operatorDisplayName}
                </p>
              </div>
            </a>
          </div>
        ) : (
          <div className="border-t border-border mt-4 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-label">Operator</span>
              <Badge variant="secondary" className="text-xs">
                Not Announced
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
