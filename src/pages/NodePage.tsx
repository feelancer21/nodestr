import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NodeBanner } from '@/components/node/NodeBanner';
import { NodeInfoContent } from '@/components/clip/NodeInfoContent';
import { ViewSourceModal } from '@/components/clip/ViewSourceModal';
import { useNodeDetails } from '@/hooks/useNodeDetails';
import { formatRelativeTime } from '@/lib/utils';
import { isValidLightningPubkey, pubkeyAlias } from '@/lib/lightning';
import type { Network, MempoolNode } from '@/types/search';

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
  const isValidPubkey = isValidLightningPubkey(pubkey || '');

  const { node, operator, nodeInfo, isLoading } = useNodeDetails(pubkey || '', network);

  // Effective node: use mempool data if available, otherwise synthetic for valid pubkeys
  const effectiveNode = useMemo(() => {
    if (node) return node;
    if (!isValidPubkey) return undefined;
    return {
      public_key: pubkey!,
      alias: pubkeyAlias(pubkey!),
      capacity: null as unknown as number,
      channels: null as unknown as number,
      status: 1,
    } as MempoolNode;
  }, [node, isValidPubkey, pubkey]);

  const pageTitle = useMemo(() => {
    if (effectiveNode) {
      return `${effectiveNode.alias} - nodestr`;
    }
    return 'Lightning Node - nodestr';
  }, [effectiveNode]);

  useSeoMeta({
    title: pageTitle,
    description: effectiveNode
      ? `Lightning node on ${network}`
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

  // Invalid pubkey - show immediately, no loading needed
  if (!isValidPubkey) {
    return (
      <section className="grid gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Invalid Lightning Pubkey
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-2">
              The provided pubkey is not a valid Lightning node public key.
            </p>
            <p className="font-mono text-xs break-all">{pubkey}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Loading state - only for valid pubkeys
  if (isLoading) {
    return <NodePageSkeleton />;
  }

  // Render node (from mempool or synthetic)
  return (
    <section className="grid gap-6">
      <NodeBanner node={effectiveNode!} network={network} operator={operator} />

      {nodeInfo && (
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">
                Node Info
              </CardTitle>
              <span
                className="text-xs text-muted-foreground"
                title={new Date(nodeInfo.event.created_at * 1000).toLocaleString()}
              >
                {formatRelativeTime(nodeInfo.event.created_at)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <NodeInfoContent content={nodeInfo.content} />
          </CardContent>
          <CardFooter className="pt-0 flex justify-end">
            <ViewSourceModal event={nodeInfo.event} />
          </CardFooter>
        </Card>
      )}
    </section>
  );
}

export default NodePage;
