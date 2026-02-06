import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/clip/CopyButton';
import { cn } from '@/lib/utils';
import type { MempoolNode, Network } from '@/types/search';
import { useSearch } from '@/contexts/SearchContext';

interface NodeCardProps {
  node: MempoolNode;
  network: Network;
  className?: string;
}

function formatCapacitySats(satoshis: number | null | undefined): string {
  if (satoshis == null) return '—';
  return satoshis.toLocaleString() + ' sats';
}

function truncatePubkey(pubkey: string): string {
  // Shorter format for narrow screens: 6...4
  return pubkey.slice(0, 6) + '...' + pubkey.slice(-4);
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

export function NodeCard({ node, network, className }: NodeCardProps) {
  const navigate = useNavigate();
  const { setQuery } = useSearch();
  const isOffline = node.status === 0;

  const handleClick = () => {
    setQuery('');
    navigate(`/lightning/${network}/node/${node.public_key}`);
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'border-border bg-card cursor-pointer transition-colors hover:bg-muted/50 h-full',
        isOffline && 'opacity-60',
        className
      )}
    >
      <CardContent className="p-4 flex flex-col justify-center h-full">
        {/* Header row: Label + Network Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-label">Node</span>
          <Badge className={cn('text-xs shrink-0', getNetworkBadgeClasses(network))}>
            {network}
          </Badge>
        </div>

        {/* Main content row: Alias/Pubkey + Capacity */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          {/* Left: Alias and Pubkey */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <h3 className="text-base font-semibold text-foreground truncate max-w-full">
              {node.alias}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-mono text-muted-foreground truncate">
                {truncatePubkey(node.public_key)}
              </span>
              <CopyButton value={node.public_key} />
            </div>
          </div>

          {/* Right: Capacity */}
          <div className="sm:text-right shrink-0">
            <span className="text-xs text-label">Capacity</span>
            <p className="text-sm text-foreground">
              {formatCapacitySats(node.capacity)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
