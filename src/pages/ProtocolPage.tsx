import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownContent } from '@/components/MarkdownContent';

const CLIP_DOC_PUBKEY = 'f5c22b18c3b40e3d207ebf445524b307f01b28499c25117d4694cb9c344c21fc';
const CLIP_DOC_KIND = 30817;
const CLIP_DOC_DTAG = 'clip';

export function ProtocolPage() {
  const { nostr } = useNostr();

  useSeoMeta({
    title: 'CLIP Protocol - nodestr',
    description: 'The Common Lightning-node Information Payload protocol specification.',
  });

  const { data: content, isLoading, isError } = useQuery({
    queryKey: ['clip-protocol-doc'],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{
          kinds: [CLIP_DOC_KIND],
          authors: [CLIP_DOC_PUBKEY],
          '#d': [CLIP_DOC_DTAG],
        }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) },
      );

      if (events.length === 0) return null;

      // Kind 30817 is addressable/replaceable — take most recent
      const latest = events.sort((a, b) => b.created_at - a.created_at)[0];
      return latest.content;
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  return (
    <section className="grid gap-6">
      <div>
        <Link
          to="/about"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          About
        </Link>
      </div>

      {isLoading && (
        <Card className="border-border bg-card">
          <CardContent className="py-8 space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-6 w-48 mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Could not load the protocol specification. Please check your relay connection and try again.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && !content && (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            The protocol specification event was not found on your relays.
          </CardContent>
        </Card>
      )}

      {content && (
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="py-8 sm:py-8 px-6 sm:px-8 overflow-x-auto">
            <MarkdownContent content={content} />
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export default ProtocolPage;
