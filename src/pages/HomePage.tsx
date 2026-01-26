import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useClipFeed } from '@/hooks/useClipFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function HomePage() {
  const navigate = useNavigate();
  const feed = useClipFeed();
  const feedEvents = feed.data ?? [];

  useSeoMeta({
    title: 'nodestr — Lightning Operators on Nostr',
    description: 'nodestr is a browser-only Nostr client for Lightning node operators.',
  });

  return (
    <>
      <header className="rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-emerald-100 via-slate-50 to-white dark:from-emerald-500/20 dark:via-slate-900/80 dark:to-slate-950 p-8 shadow-2xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold">Work in progress</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">This area is under construction and will change in later phases.</p>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300/80">Feed</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Events are filtered locally; Lightning signature crypto checks are not enabled yet.</p>
          </div>
          <Badge variant="secondary" className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
            {feedEvents?.length ?? 0} events
          </Badge>
        </div>

        {feed.isLoading && (
          <div className="grid gap-4">
            {[0, 1, 2].map((idx) => (
              <Card key={idx} className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
                <CardHeader className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {feed.isError && (
          <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Relay Error</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 dark:text-slate-200">
              We couldn't load CLIP events from your relays. Try again in a moment.
            </CardContent>
          </Card>
        )}

        {!feed.isLoading && !feed.isError && feedEvents.length === 0 && (
          <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
            <CardContent className="py-12 text-center text-sm text-slate-600 dark:text-slate-300">
              No events yet. Check your relays or wait for announcements to appear.
            </CardContent>
          </Card>
        )}

        {!feed.isLoading && !feed.isError && feedEvents.length > 0 && (
          <div className="grid gap-4">
            {feedEvents.map(({ event, identifier }) => {
              const isAnnouncement = identifier.kind === 0;
              const network = identifier.network;
              const createdAt = new Date(event.created_at * 1000);
              const now = Date.now();
              const diffSeconds = Math.max(0, Math.floor((now - createdAt.getTime()) / 1000));
              const timeLabel = diffSeconds < 60
                ? `${diffSeconds}s ago`
                : diffSeconds < 3600
                  ? `${Math.floor(diffSeconds / 60)}m ago`
                  : diffSeconds < 86400
                    ? `${Math.floor(diffSeconds / 3600)}h ago`
                    : `${Math.floor(diffSeconds / 86400)}d ago`;

              const alias = identifier.pubkey.slice(0, 20);

              return (
                <button
                  key={event.id}
                  onClick={() => {
                    try {
                      const npub = nip19.npubEncode(event.pubkey);
                      navigate(`/profile/${npub}`);
                    } catch {
                      navigate(`/profile/${event.pubkey}`);
                    }
                  }}
                  className="text-left hover:bg-slate-100 dark:bg-white/10 transition rounded-xl"
                >
                  <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
                    <CardHeader className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{alias}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{identifier.pubkey.slice(0, 12)}…</p>
                        </div>
                        <span
                          className="text-xs text-slate-500 dark:text-slate-400"
                          title={createdAt.toLocaleString()}
                        >
                          {timeLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                          {isAnnouncement ? 'Announcement' : 'Node Info'}
                        </Badge>
                        {network && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs',
                              network === 'mainnet' && 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
                              network === 'testnet' && 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-200',
                              network === 'testnet4' && 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-200',
                              network === 'signet' && 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200',
                              !['mainnet', 'testnet', 'testnet4', 'signet'].includes(network) &&
                                'bg-slate-200 dark:bg-slate-500/10 text-slate-700 dark:text-slate-200'
                            )}
                          >
                            {network}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                      {isAnnouncement
                        ? 'Node Announcement (CLIP k=0). Run by this operator.'
                        : 'Node Info (CLIP k=1). Published by this operator.'}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export default HomePage;
