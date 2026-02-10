import { useState } from 'react';
import { Moon, Sun, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/hooks/useTheme';
import { RelayCard } from '@/components/relay/RelayCard';
import { RelayListHeader } from '@/components/relay/RelayListHeader';
import { RelayAddForm } from '@/components/relay/RelayAddForm';
import { DUMMY_RELAYS } from '@/components/relay/dummyRelayData';
import type { RelayHealthInfo } from '@/components/relay/dummyRelayData';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [relays, setRelays] = useState<RelayHealthInfo[]>(DUMMY_RELAYS);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleRead = (url: string) => {
    setRelays(prev => prev.map(r => (r.url === url ? { ...r, read: !r.read } : r)));
  };

  const handleToggleWrite = (url: string) => {
    setRelays(prev => prev.map(r => (r.url === url ? { ...r, write: !r.write } : r)));
  };

  const handleTogglePin = (url: string) => {
    setRelays(prev => prev.map(r => (r.url === url ? { ...r, isPinned: !r.isPinned } : r)));
  };

  const handleRemove = (url: string) => {
    setRelays(prev => prev.filter(r => r.url !== url));
  };

  const handleAddRelay = (url: string) => {
    const now = Math.floor(Date.now() / 1000);
    const newRelay: RelayHealthInfo = {
      url,
      status: 'unknown',
      latencyMs: null,
      clipEventsCount: 0,
      lastChecked: now,
      isPinned: true,
      read: true,
      write: true,
      nip11: null,
    };
    setRelays(prev => [...prev, newRelay]);
  };

  const handleTestAll = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const allUnreachable =
    relays.length > 0 && relays.every(r => r.status === 'unreachable');

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
          {!isLoading && relays.length > 0 && (
            <RelayListHeader relays={relays} onTestAll={handleTestAll} />
          )}

          {/* Error banner: all relays unreachable */}
          {allUnreachable && (
            <div className="flex items-center gap-2 p-3 rounded-md border border-amber-500/50 bg-amber-500/10 text-sm text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              All relays are unreachable. Check your network connection.
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
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
          {!isLoading && relays.length > 0 && (
            <div className="space-y-2">
              {relays.map((relay) => (
                <RelayCard
                  key={relay.url}
                  relay={relay}
                  onToggleRead={handleToggleRead}
                  onToggleWrite={handleToggleWrite}
                  onTogglePin={handleTogglePin}
                  onRemove={handleRemove}
                  canRemove={relays.length > 1}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && relays.length === 0 && (
            <div className="rounded-md border-2 border-dashed border-border py-12 sm:py-12 text-center">
              <p className="text-muted-foreground text-sm">
                No relays configured. Add a relay to get started.
              </p>
            </div>
          )}

          {/* Add relay form */}
          <RelayAddForm
            existingUrls={relays.map(r => r.url)}
            onAdd={handleAddRelay}
          />
        </CardContent>
      </Card>
    </section>
  );
}

export default SettingsPage;
