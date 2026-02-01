import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NodeBanner } from '@/components/node/NodeBanner';
import { NodeInfoContent } from '@/components/clip/NodeInfoContent';
import { useNodeDetails } from '@/hooks/useNodeDetails';
import type { Network } from '@/types/search';

const VALID_NETWORKS = ['mainnet', 'testnet', 'testnet4', 'signet'] as const;

function isValidNetwork(network: string | undefined): network is Network {
  return network !== undefined && VALID_NETWORKS.includes(network as Network);
}

function NodePageSkeleton() {
  return (
    <section className="grid gap-6">
      {/* Banner skeleton */}
      <div className="rounded-3xl border border-border overflow-hidden">
        <Skeleton className="h-32 w-full" />
        <div className="px-6 sm:px-8 pb-6 pt-4 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-6">
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Node Info placeholder skeleton */}
      <Card className="border-border bg-card">
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </section>
  );
}

// Export for potential future use
export { NodePageSkeleton };

export function NodePage() {
  const { network: networkParam, pubkey } = useParams<{
    network: string;
    pubkey: string;
  }>();

  const isValidNet = isValidNetwork(networkParam);
  const network = isValidNet ? networkParam : 'mainnet';

  const { node, operator, nodeInfo, isLoading, isError } = useNodeDetails(pubkey || '', network);

  const pageTitle = useMemo(() => {
    if (node) {
      return `${node.alias} - nodestr`;
    }
    return 'Lightning Node - nodestr';
  }, [node]);

  useSeoMeta({
    title: pageTitle,
    description: node
      ? `Lightning node ${node.alias} on ${network}`
      : 'Lightning node on nodestr',
  });

  // Invalid network error
  if (!isValidNet) {
    return (
      <section className="grid gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Invalid Network
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The network &quot;{networkParam}&quot; is not valid. Supported networks are:
            mainnet, testnet, testnet4, and signet.
          </CardContent>
        </Card>
      </section>
    );
  }

  // Loading state
  if (isLoading) {
    return <NodePageSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <section className="grid gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Error Loading Node
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Failed to load node data. Please try again later.
          </CardContent>
        </Card>
      </section>
    );
  }

  // Node not found
  if (!node) {
    return (
      <section className="grid gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Node Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-2">
              Could not find a Lightning node with the specified pubkey on {network}.
            </p>
            <p className="font-mono text-xs break-all">{pubkey}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      {/* Node Banner - combines node info and operator */}
      <NodeBanner node={node} network={network} operator={operator} />

      {/* Node Info - only shown if nodeInfo exists */}
      {nodeInfo && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Node Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NodeInfoContent content={nodeInfo.content} />
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export default NodePage;
