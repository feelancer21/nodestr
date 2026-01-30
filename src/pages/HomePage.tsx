import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useClipFeed } from '@/hooks/useClipFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipEventCard } from '@/components/clip';

export function HomePage() {
  const navigate = useNavigate();
  const feed = useClipFeed();
  const feedEvents = feed.data ?? [];

  useSeoMeta({
    title: 'nodestr — Lightning Nodes on Nostr',
    description: 'nodestr is a browser-only Nostr client for Lightning node operators.',
  });

  return (
    <>
      <section className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Feed</h2>
            <Badge variant="secondary" className="whitespace-nowrap">
              {feedEvents?.length ?? 0} events
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Events are filtered locally; Lightning signature crypto checks are not enabled yet.</span>
          </p>
        </div>

        {feed.isLoading && (
          <div className="grid gap-4">
            {[0, 1, 2].map((idx) => (
              <Card key={idx} className="border-border bg-card text-card-foreground">
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
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Relay Error</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground">
              We couldn't load CLIP events from your relays. Try again in a moment.
            </CardContent>
          </Card>
        )}

        {!feed.isLoading && !feed.isError && feedEvents.length === 0 && (
          <Card className="border-border bg-card text-card-foreground">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No events yet. Check your relays or wait for announcements to appear.
            </CardContent>
          </Card>
        )}

        {!feed.isLoading && !feed.isError && feedEvents.length > 0 && (
          <div className="grid gap-4">
            {feedEvents.map((stored) => (
              <ClipEventCard
                key={stored.event.id}
                storedEvent={stored}
                onClick={() => {
                  try {
                    const npub = nip19.npubEncode(stored.event.pubkey);
                    navigate(`/profile/${npub}`);
                  } catch {
                    navigate(`/profile/${stored.event.pubkey}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default HomePage;
