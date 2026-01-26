import { useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useOperatorProfile } from '@/hooks/useOperatorProfile';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OperatorProfileProps {
  pubkey: string;
}

export function OperatorProfile({ pubkey }: OperatorProfileProps) {
  const profile = useOperatorProfile(pubkey || '');
  const author = useAuthor(pubkey);

  useSeoMeta({
    title: `${genUserName(pubkey || '')} - nodestr`,
    description: `Lightning node operator profile on nodestr`,
  });

  const displayName = useMemo(() => {
    if (author.data?.metadata?.name) {
      return author.data.metadata.name;
    }
    return genUserName(pubkey || '');
  }, [author.data?.metadata, pubkey]);

  const npub = useMemo(() => {
    if (!pubkey) return null;
    try {
      return nip19.npubEncode(pubkey);
    } catch {
      return null;
    }
  }, [pubkey]);

  const shortNpub = useMemo(() => {
    if (!npub) return null;
    return `${npub.slice(0, 12)}…${npub.slice(-6)}`;
  }, [npub]);

  const shortenPubkey = (pk: string, length: number = 20) => {
    return `${pk.slice(0, length)}…`;
  };

  const getNetworkBadgeColor = (network: string) => {
    switch (network) {
      case 'mainnet':
        return 'bg-emerald-500/10 text-emerald-200';
      case 'testnet':
        return 'bg-blue-500/10 text-blue-200';
      case 'testnet4':
        return 'bg-indigo-500/10 text-indigo-200';
      case 'signet':
        return 'bg-amber-500/10 text-amber-200';
      default:
        return 'bg-slate-500/10 text-slate-200';
    }
  };

  if (!pubkey) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardContent className="py-12 text-center text-sm text-slate-300">
            Invalid profile pubkey.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button */}
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 text-slate-300 hover:text-slate-100"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-slate-900/50 to-slate-950 p-8">
          {author.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold">{displayName}</h1>
                  {npub && (
                    <p className="text-xs font-mono text-slate-400">
                      {npub}
                    </p>
                  )}
                </div>
                {author.data?.metadata?.picture && (
                  <img
                    src={author.data.metadata.picture}
                    alt={displayName}
                    className="h-16 w-16 rounded-full object-cover border border-white/10"
                  />
                )}
              </div>
              {author.data?.metadata?.about && (
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  {author.data.metadata.about}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Operated Lightning Nodes Section */}
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              Operated Lightning Nodes
            </p>
            <h2 className="text-xl font-semibold mt-2">
              {profile.isLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : profile.data?.operatedNodes.length === 0 ? (
                'No nodes operated'
              ) : (
                `${profile.data?.operatedNodes.length} node${
                  profile.data?.operatedNodes.length === 1 ? '' : 's'
                }`
              )}
            </h2>
          </div>

          {profile.isLoading && (
            <div className="grid gap-4">
              {[0, 1].map((idx) => (
                <Card key={idx} className="border-white/10 bg-white/5 text-slate-100">
                  <CardHeader className="space-y-3">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {profile.isError && (
            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-200">
                Could not load operator profile. Try again in a moment.
              </CardContent>
            </Card>
          )}

          {!profile.isLoading && !profile.isError && profile.data?.operatedNodes.length === 0 && (
            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardContent className="py-8 text-center text-sm text-slate-300">
                This user has not published any Lightning node announcements.
              </CardContent>
            </Card>
          )}

          {!profile.isLoading &&
            !profile.isError &&
            profile.data?.operatedNodes &&
            profile.data.operatedNodes.length > 0 && (
              <div className="grid gap-6">
                {profile.data.operatedNodes.map((node) => (
                  <div key={node.lightningPubkey} className="space-y-4">
                    {/* Node Header */}
                    <Card className="border-white/10 bg-white/5 text-slate-100">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <p className="text-sm font-mono text-slate-300">
                              {node.lightningPubkey}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {node.networks.map((network) => (
                                <Badge
                                  key={network}
                                  variant="secondary"
                                  className={cn('text-xs', getNetworkBadgeColor(network))}
                                >
                                  {network}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <a
                            href={`https://mempool.space/lightning/node/${node.lightningPubkey}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-emerald-300 transition"
                            title="View on mempool.space"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Node Info Payloads */}
                    {node.nodeInfoPayloads.length > 0 && (
                      <div className="space-y-3 ml-4">
                        {node.nodeInfoPayloads.map((info, idx) => (
                          <Card
                            key={`${node.lightningPubkey}-${info.network}-${idx}`}
                            className="border-white/10 bg-white/5 text-slate-100"
                          >
                            <CardHeader>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Node Info — {info.network}
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                              {typeof info.content === 'object' && info.content !== null && (
                                <>
                                  {/* About */}
                                  {(info.content as Record<string, unknown>).about && (
                                    <div>
                                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                                        About
                                      </p>
                                      <p className="text-slate-300 text-sm">
                                        {String((info.content as Record<string, unknown>).about)}
                                      </p>
                                    </div>
                                  )}

                                  {/* Channel Size Constraints */}
                                  {((info.content as Record<string, unknown>).min_channel_size_sat ||
                                    (info.content as Record<string, unknown>).max_channel_size_sat) && (
                                    <div>
                                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                                        Channel Size
                                      </p>
                                      <div className="space-y-1 text-slate-300">
                                        {(info.content as Record<string, unknown>).min_channel_size_sat && (
                                          <p>
                                            Min:{' '}
                                            {Number(
                                              (info.content as Record<string, unknown>)
                                                .min_channel_size_sat
                                            ).toLocaleString()}{' '}
                                            sat
                                          </p>
                                        )}
                                        {(info.content as Record<string, unknown>).max_channel_size_sat && (
                                          <p>
                                            Max:{' '}
                                            {Number(
                                              (info.content as Record<string, unknown>)
                                                .max_channel_size_sat
                                            ).toLocaleString()}{' '}
                                            sat
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Contact Info */}
                                  {Array.isArray(
                                    (info.content as Record<string, unknown>).contact_info
                                  ) &&
                                    (info.content as Record<string, unknown>).contact_info.length >
                                      0 && (
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                                          Contact Info
                                        </p>
                                        <ul className="space-y-1 text-slate-300">
                                          {((info.content as Record<string, unknown>)
                                            .contact_info as Array<Record<string, unknown>>).map(
                                            (contact, cidx) => (
                                              <li key={cidx} className="text-sm">
                                                <span className="text-emerald-300">
                                                  {String(contact.type)}
                                                </span>
                                                : {String(contact.value)}
                                                {contact.primary && (
                                                  <Badge variant="secondary" className="ml-2 text-xs">
                                                    Primary
                                                  </Badge>
                                                )}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  {/* Custom Records */}
                                  {typeof (info.content as Record<string, unknown>).custom_records ===
                                    'object' &&
                                    (info.content as Record<string, unknown>).custom_records !== null &&
                                    Object.keys(
                                      (info.content as Record<string, unknown>).custom_records as object
                                    ).length > 0 && (
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                                          Custom Records
                                        </p>
                                        <dl className="space-y-2 text-slate-300 text-sm">
                                          {Object.entries(
                                            (info.content as Record<string, unknown>)
                                              .custom_records as object
                                          ).map(([key, value]) => (
                                            <div key={key} className="flex flex-col">
                                              <dt className="text-emerald-300 font-mono">{key}</dt>
                                              <dd className="text-slate-400 ml-2">
                                                {String(value)}
                                              </dd>
                                            </div>
                                          ))}
                                        </dl>
                                      </div>
                                    )}
                                </>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </section>

        {/* Operator Timeline */}
        {profile.data && profile.data.events.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Timeline</p>
              <h2 className="text-xl font-semibold mt-2">
                {profile.data.events.length} CLIP event{profile.data.events.length === 1 ? '' : 's'}
              </h2>
            </div>

            <div className="grid gap-4">
              {profile.data.events.map((item) => {
                const createdAt = new Date(item.event.created_at * 1000);
                const now = Date.now();
                const diffSeconds = Math.max(0, Math.floor((now - createdAt.getTime()) / 1000));
                const timeLabel =
                  diffSeconds < 60
                    ? `${diffSeconds}s ago`
                    : diffSeconds < 3600
                      ? `${Math.floor(diffSeconds / 60)}m ago`
                      : diffSeconds < 86400
                        ? `${Math.floor(diffSeconds / 3600)}h ago`
                        : `${Math.floor(diffSeconds / 86400)}d ago`;

                return (
                  <Card key={item.event.id} className="border-white/10 bg-white/5 text-slate-100">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-white/10 text-slate-200">
                          {item.kind === 0 ? 'Announcement' : 'Node Info'}
                        </Badge>
                        <span
                          className="text-xs text-slate-400"
                          title={createdAt.toLocaleString()}
                        >
                          {timeLabel}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-300">
                      {item.kind === 0
                        ? 'Node Announcement (CLIP k=0). Links a Lightning node to this Nostr identity.'
                        : 'Node Information (CLIP k=1). Contains metadata about the operated node.'}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default OperatorProfile;
