import { cn } from '@/lib/utils';
import type { MempoolNode } from '@/types/search';

interface QuickSearchItemProps {
  node: MempoolNode;
  onClick: () => void;
  isHighlighted?: boolean;
}

function formatCapacity(satoshis: number): string {
  const btc = satoshis / 100_000_000;
  return btc.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' BTC';
}

function truncatePubkey(pubkey: string): string {
  return pubkey.slice(0, 8) + '...';
}

export function QuickSearchItem({ node, onClick, isHighlighted }: QuickSearchItemProps) {
  const isOffline = node.status === 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 text-left',
        'hover:bg-muted transition-colors rounded-sm',
        isOffline && 'opacity-50',
        isHighlighted && 'bg-muted'
      )}
    >
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-sm text-foreground truncate">
          {node.alias}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {truncatePubkey(node.public_key)}
        </span>
      </div>
      <span className="text-xs text-muted-foreground ml-2 shrink-0">
        {formatCapacity(node.capacity)}
      </span>
    </button>
  );
}
