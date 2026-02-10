import { Moon, Sun, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/hooks/useTheme';
import { useAppContext } from '@/hooks/useAppContext';
import { useRelayHealth } from '@/hooks/useRelayHealth';
import { normalizeRelayUrl } from '@/lib/relayHealthStore';
import { RelayCard } from '@/components/relay/RelayCard';
import { RelayListHeader } from '@/components/relay/RelayListHeader';
import { RelayAddForm } from '@/components/relay/RelayAddForm';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { config, updateConfig } = useAppContext();
  const { healthData, isProbing, probeAll, togglePin } = useRelayHealth();

  // Relay list from AppContext (single source of truth)
  const relayList = config.relayMetadata.relays;

  // Combine relay list with health data for display
  const enrichedRelays = relayList.map(relay => {
    const url = normalizeRelayUrl(relay.url);
    return {
      url,
      read: relay.read,
      write: relay.write,
      health: healthData.get(url),
    };
  });

  const allUnreachable =
    enrichedRelays.length > 0 &&
    enrichedRelays.every(r => r.health?.status === 'unreachable');

  // User actions → updateConfig (relay list changes)
  const addRelay = (url: string) => {
    const normalized = normalizeRelayUrl(url);
    updateConfig((current) => ({
      ...current,
      relayMetadata: {
        relays: [
          ...(current.relayMetadata?.relays ?? []),
          { url: normalized, read: true, write: true },
        ],
        updatedAt: Math.floor(Date.now() / 1000),
      },
    }));
  };

  const removeRelay = (url: string) => {
    const normalized = normalizeRelayUrl(url);
    updateConfig((current) => ({
      ...current,
      relayMetadata: {
        relays: (current.relayMetadata?.relays ?? []).filter(
          r => normalizeRelayUrl(r.url) !== normalized
        ),
        updatedAt: Math.floor(Date.now() / 1000),
      },
    }));
  };

  const toggleRead = (url: string) => {
    const normalized = normalizeRelayUrl(url);
    updateConfig((current) => ({
      ...current,
      relayMetadata: {
        relays: (current.relayMetadata?.relays ?? []).map(r =>
          normalizeRelayUrl(r.url) === normalized
            ? { ...r, read: !r.read }
            : r
        ),
        updatedAt: Math.floor(Date.now() / 1000),
      },
    }));
  };

  const toggleWrite = (url: string) => {
    const normalized = normalizeRelayUrl(url);
    updateConfig((current) => ({
      ...current,
      relayMetadata: {
        relays: (current.relayMetadata?.relays ?? []).map(r =>
          normalizeRelayUrl(r.url) === normalized
            ? { ...r, write: !r.write }
            : r
        ),
        updatedAt: Math.floor(Date.now() / 1000),
      },
    }));
  };

  return (
    <section className="grid gap-6">
      {/* Appearance Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <Label
                htmlFor="theme-toggle"
                className="text-sm cursor-pointer text-foreground"
              >
                Dark Mode
              </Label>
            </div>
            <Switch
              id="theme-toggle"
              checked={isDarkMode}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Relays Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Relays
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Header with counts */}
          {enrichedRelays.length > 0 && (
            <RelayListHeader
              relays={enrichedRelays}
              onTestAll={probeAll}
              isProbing={isProbing}
            />
          )}

          {/* Error banner: all relays unreachable */}
          {allUnreachable && (
            <div className="flex items-center gap-2 p-3 rounded-md border border-amber-500/50 bg-amber-500/10 text-sm text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              All relays are unreachable. Check your network connection.
            </div>
          )}

          {/* Loading skeleton — only while probing with no existing data */}
          {isProbing && enrichedRelays.length === 0 && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-md border border-border p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-2.5 rounded-full" />
                    <Skeleton className="h-4 w-48" />
                    <div className="flex-1" />
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Relay list */}
          {enrichedRelays.length > 0 && (
            <div className="space-y-2">
              {enrichedRelays.map((relay) => (
                <RelayCard
                  key={relay.url}
                  url={relay.url}
                  read={relay.read}
                  write={relay.write}
                  health={relay.health}
                  onToggleRead={toggleRead}
                  onToggleWrite={toggleWrite}
                  onTogglePin={togglePin}
                  onRemove={removeRelay}
                  canRemove={enrichedRelays.length > 1}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isProbing && enrichedRelays.length === 0 && (
            <div className="rounded-md border-2 border-dashed border-border py-12 sm:py-12 text-center">
              <p className="text-muted-foreground text-sm">
                No relays configured. Add a relay to get started.
              </p>
            </div>
          )}

          {/* Add relay form */}
          <RelayAddForm
            existingUrls={enrichedRelays.map(r => r.url)}
            onAdd={addRelay}
          />
        </CardContent>
      </Card>
    </section>
  );
}

export default SettingsPage;
