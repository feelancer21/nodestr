import { cn } from '@/lib/utils';
import { NodeCard } from './NodeCard';
import { OperatorCard } from './OperatorCard';
import { getMockOperator } from '@/lib/mockSearchData';
import type { MempoolNode, Network } from '@/types/search';

interface SearchResultPairProps {
  node: MempoolNode;
  network: Network;
  className?: string;
}

export function SearchResultPair({ node, network, className }: SearchResultPairProps) {
  const operator = getMockOperator(node.public_key);

  return (
    <div className={cn('flex flex-row gap-3 items-stretch', className)}>
      <div className="flex-1 min-w-0">
        <NodeCard node={node} network={network} />
      </div>
      <div className="flex-1 min-w-0">
        <OperatorCard operator={operator} />
      </div>
    </div>
  );
}
