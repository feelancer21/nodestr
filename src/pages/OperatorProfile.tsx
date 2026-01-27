import { useMemo, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import { Globe } from 'lucide-react';
import { useOperatorProfile } from '@/hooks/useOperatorProfile';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnnouncementCard, NodeInfoCard } from '@/components/clip';
import { CopyButton } from '@/components/clip/CopyButton';
import { FormattedText } from '@/components/clip/FormattedText';
import { ImageZoomModal } from '@/components/clip/ImageZoomModal';
import { pubkeyToColor } from '@/lib/utils';

interface OperatorProfileProps {
  pubkey: string;
}

export function OperatorProfile({ pubkey }: OperatorProfileProps) {
  const profile = useOperatorProfile(pubkey || '');
  const author = useAuthor(pubkey);
  const [bannerZoomOpen, setBannerZoomOpen] = useState(false);
  const [avatarZoomOpen, setAvatarZoomOpen] = useState(false);

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

  const npubShort = useMemo(() => {
    if (!npub) return null;
    return `${npub.slice(0, 12)}...${npub.slice(-6)}`;
  }, [npub]);

  const avatarColor = useMemo(() => pubkeyToColor(pubkey || ''), [pubkey]);

  const initials = useMemo(() => {
    const words = displayName.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return '??';
  }, [displayName]);

  if (!pubkey) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Invalid profile pubkey.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Profile Header with Banner */}
      <div className="rounded-3xl border border-border overflow-hidden">
        {/* Banner area */}
        <div className="h-44 relative">
          {author.data?.metadata?.banner ? (
            <button
              onClick={() => setBannerZoomOpen(true)}
              className="w-full h-full block"
            >
              <img
                src={author.data.metadata.banner}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-slate-50 to-white dark:from-emerald-500/20 dark:via-slate-900/80 dark:to-slate-950" />
          )}
        </div>

        {/* Content area with overlapping avatar */}
        <div className="relative px-6 sm:px-8 pb-8 pt-4 bg-card">
          {/* Avatar - positioned to overlap banner */}
          <div className="absolute -top-12 left-6 sm:left-8">
            {author.isLoading ? (
              <Skeleton className="h-20 w-20 rounded-full border-4 border-card" />
            ) : author.data?.metadata?.picture ? (
              <button onClick={() => setAvatarZoomOpen(true)}>
                <img
                  src={author.data.metadata.picture}
                  alt={displayName}
                  className="h-20 w-20 rounded-full object-cover border-4 border-card"
                />
              </button>
            ) : (
              <div
                className="h-20 w-20 rounded-full border-4 border-card flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Name and npub */}
          {author.isLoading ? (
            <div className="ml-24 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <div className="ml-24">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                {displayName}
              </h1>
              {npub && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    {npubShort}
                  </span>
                  <CopyButton value={npub} />
                </div>
              )}
            </div>
          )}

          {/* About text */}
          {!author.isLoading && author.data?.metadata?.about && (
            <p className="mt-6 text-sm text-foreground leading-relaxed max-w-2xl break-words">
              <FormattedText text={author.data.metadata.about} />
            </p>
          )}

          {/* Website link - after about text */}
          {!author.isLoading && author.data?.metadata?.website && (
            <div className="flex items-center gap-1.5 mt-4">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <a
                href={author.data.metadata.website.startsWith('http') ? author.data.metadata.website : `https://${author.data.metadata.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-link hover:underline truncate max-w-[250px] sm:max-w-[350px]"
              >
                {author.data.metadata.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modals */}
      {author.data?.metadata?.banner && (
        <ImageZoomModal
          src={author.data.metadata.banner}
          alt="Profile banner"
          open={bannerZoomOpen}
          onOpenChange={setBannerZoomOpen}
        />
      )}
      {author.data?.metadata?.picture && (
        <ImageZoomModal
          src={author.data.metadata.picture}
          alt={displayName}
          open={avatarZoomOpen}
          onOpenChange={setAvatarZoomOpen}
        />
      )}

      {/* Operating Lightning Nodes Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {profile.isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : profile.data?.operatedNodes.length === 0 ? (
              'Operating no nodes'
            ) : profile.data?.operatedNodes.length === 1 ? (
              'Operating 1 Lightning Node'
            ) : (
              `Operating ${profile.data?.operatedNodes.length} Lightning Nodes`
            )}
          </h2>
        </div>

        {profile.isLoading && (
          <div className="grid gap-4">
            {[0, 1].map((idx) => (
              <Card key={idx} className="border-border bg-card">
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
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground">
              Could not load operator profile. Try again in a moment.
            </CardContent>
          </Card>
        )}

        {!profile.isLoading && !profile.isError && profile.data?.operatedNodes.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              This user has not published any Lightning node announcements.
            </CardContent>
          </Card>
        )}

        {!profile.isLoading &&
          !profile.isError &&
          profile.data?.operatedNodes &&
          profile.data.operatedNodes.length > 0 && (
            <div className="grid gap-6">
              {profile.data.operatedNodes.map((node) => {
                // Find the most recent announcement for this node
                const announcement = profile.data?.events.find(
                  (e) => e.kind === 0 && e.event.tags.find(([name, val]) => name === 'd' && val === node.lightningPubkey)
                );

                // Find all Node Info events for this node, sorted by created_at descending
                const nodeInfoEvents = profile.data?.events
                  .filter(
                    (e) =>
                      e.kind === 1 &&
                      e.event.tags.find(([name, val]) => name === 'd' && val.includes(node.lightningPubkey))
                  )
                  .sort((a, b) => b.event.created_at - a.event.created_at) || [];

                return (
                  <div key={node.lightningPubkey} className="space-y-4">
                    {/* Announcement Card */}
                    {announcement && (
                      <AnnouncementCard
                        event={announcement.event}
                        identifier={{
                          tagD: node.lightningPubkey,
                          kind: 0,
                          pubkey: node.lightningPubkey,
                          opts: [],
                        }}
                      />
                    )}

                    {/* Node Info Cards - indented */}
                    {nodeInfoEvents.length > 0 && (
                      <div className="ml-4 space-y-4">
                        {nodeInfoEvents.map((info) => {
                          // Parse d-tag: format is "1:<lightning_pubkey>:<network>"
                          const dTag = info.event.tags.find(([name]) => name === 'd')?.[1] || '';
                          const parts = dTag.split(':');
                          const network = parts.length >= 3 ? parts[2] : 'unknown';

                          return (
                            <NodeInfoCard
                              key={info.event.id}
                              event={info.event}
                              identifier={{
                                tagD: dTag,
                                kind: 1,
                                pubkey: node.lightningPubkey,
                                network,
                                opts: parts.slice(3),
                              }}
                              content={info.content}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </section>
    </>
  );
}

export default OperatorProfile;
