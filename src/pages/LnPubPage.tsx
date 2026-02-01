import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CLIP_KIND, verifyClipEvent, CLIP_ANNOUNCEMENT } from '@/lib/clip';

export function LnPubPage() {
  const { lightningPubkey } = useParams<{ lightningPubkey: string }>();
  const navigate = useNavigate();
  const { nostr } = useNostr();
  const [showLoadingText, setShowLoadingText] = useState(false);

  const query = useQuery({
    queryKey: ['lnpub-lookup', lightningPubkey],
    queryFn: async ({ signal }) => {
      if (!lightningPubkey) return null;

      // Query for CLIP events with this d-tag (lightning pubkey)
      const events = await nostr.query(
        [{ kinds: [CLIP_KIND], '#d': [lightningPubkey], limit: 10 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) }
      );

      const now = Math.floor(Date.now() / 1000);

      // Find valid Node Announcement
      for (const event of events) {
        const result = verifyClipEvent(event, now);
        if (result.ok && result.identifier?.kind === CLIP_ANNOUNCEMENT) {
          return event;
        }
      }

      return null;
    },
    enabled: !!lightningPubkey,
  });

  const nostrPubkey = query.data?.pubkey;

  useEffect(() => {
    if (nostrPubkey) {
      try {
        const npub = nip19.npubEncode(nostrPubkey);
        navigate(`/profile/${npub}`, { replace: true });
      } catch {
        navigate(`/profile/${nostrPubkey}`, { replace: true });
      }
    }
  }, [nostrPubkey, navigate]);

  useEffect(() => {
    if (query.isLoading) {
      const timer = setTimeout(() => setShowLoadingText(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingText(false);
    }
  }, [query.isLoading]);

  if (!lightningPubkey) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-12 min-h-[200px] flex items-center justify-center text-center text-sm text-muted-foreground">
          Invalid Lightning pubkey.
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-12 space-y-4">
          <Skeleton className="h-4 w-48 mx-auto" />
          {showLoadingText && (
            <p className="text-center text-sm text-muted-foreground">
              Looking up Lightning node operator...
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-12 min-h-[200px] flex items-center justify-center text-center text-sm text-muted-foreground">
          <div>
            No operator found for this Lightning node.
            <br />
            <span className="font-mono text-xs mt-2 block break-all">
              {lightningPubkey}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null; // Will redirect
}

export default LnPubPage;
