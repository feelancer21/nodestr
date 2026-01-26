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
      <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-slate-700 dark:text-slate-200">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              ) : (
                <Sun className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              )}
              <Label htmlFor="theme-toggle" className="text-sm cursor-pointer text-slate-600 dark:text-slate-300">
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
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Relays are stored locally in this browser. Changes apply immediately for new connections.
            </p>
          </div>
          <RelayListManager />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Info:</span>{' '}
            Relay list is not synced to Nostr in Phase 1.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default SettingsPage;
