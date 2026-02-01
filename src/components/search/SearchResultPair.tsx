import { cn } from '@/lib/utils';
import { NodeCard } from './NodeCard';
import { OperatorCard } from './OperatorCard';
import { useAuthor } from '@/hooks/useAuthor';
import type { MempoolNode, Network, OperatorInfo } from '@/types/search';

interface SearchResultPairProps {
  node: MempoolNode;
  network: Network;
  operator: OperatorInfo;
  className?: string;
}

export function SearchResultPair({ node, network, operator, className }: SearchResultPairProps) {
  // Fetch Nostr profile if there's an announcement
  const authorQuery = useAuthor(operator.pubkey);

  // Enhance operator with profile data
  const enhancedOperator: OperatorInfo = {
    ...operator,
    name: authorQuery.data?.metadata?.name,
    picture: authorQuery.data?.metadata?.picture,
  };

  return (
    <div className={cn('flex flex-row gap-3 items-stretch', className)}>
      <div className="flex-1 min-w-0">
        <NodeCard node={node} network={network} />
      </div>
      <div className="flex-1 min-w-0">
        <OperatorCard operator={enhancedOperator} />
      </div>
    </div>
  );
}
