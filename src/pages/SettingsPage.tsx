import { Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RelayListManager } from '@/components/RelayListManager';
import { useTheme } from '@/hooks/useTheme';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <section className="grid gap-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-foreground">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="theme-toggle" className="text-sm cursor-pointer text-foreground">
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

          <div>
            <p className="text-sm text-muted-foreground">
              Relays are stored locally in this browser. Changes apply immediately for new connections.
            </p>
          </div>
          <RelayListManager />
          <div className="text-xs text-muted-foreground">
            <span className="text-xs text-label">Info:</span>{' '}
            Relay list is not synced to Nostr in Phase 1.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default SettingsPage;
