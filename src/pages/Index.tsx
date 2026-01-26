import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import { Home, Menu, MessageCircle, PenSquare, PlugZap, Search, Settings, Star, Moon, Sun, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useClipFeed } from '@/hooks/useClipFeed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RelayListManager } from '@/components/RelayListManager';
import LoginDialog from '@/components/auth/LoginDialog';
import { AccountSwitcher } from '@/components/auth/AccountSwitcher';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { useTheme } from '@/hooks/useTheme';

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'publish', label: 'Publish', icon: PenSquare },
  { id: 'dms', label: 'DMs', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type SectionId = (typeof navItems)[number]['id'];

const Index = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useSeoMeta({
    title: 'nodestr — Lightning Operators on Nostr',
    description: 'nodestr is a browser-only Nostr client for Lightning node operators.',
  });

  const [loginOpen, setLoginOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('home');
  const { currentUser, removeLogin } = useLoggedInAccounts();
  const feed = useClipFeed();
  const feedEvents = feed.data ?? [];

  const isDarkMode = theme === 'dark';

  const handleLogin = async () => {
    setLoginOpen(true);
  };

  const handleProfileClick = () => {
    if (currentUser) {
      navigate(`/profile/${nip19.npubEncode(currentUser.pubkey)}`);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      removeLogin(currentUser.id);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl items-stretch gap-6 px-6 py-8">
        <div className="fixed left-4 top-6 z-40 xl:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-100 shadow-lg shadow-black/30"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-52 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 sm:w-60">
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300/80">nodestr</p>
                    </div>
                    <h1 className="text-base font-semibold">Lightning Node Identity</h1>
                  </div>
                  <nav className="space-y-2 text-sm">
                    {navItems.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveSection(id)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-4 py-2 text-left transition',
                          activeSection === id
                            ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </span>
                        {activeSection === id && (
                          <span className="text-[10px] uppercase text-emerald-700 dark:text-emerald-300">Now</span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                    {currentUser ? (
                      <>
                        <AccountSwitcher onClick={handleProfileClick} />
                        <Button variant="outline" className="w-full" onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </Button>
                      </>
                    ) : (
                      <Button className="w-full justify-start" onClick={handleLogin}>
                        <PlugZap className="mr-2 h-4 w-4" />
                        Log in
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <p className="leading-relaxed">
                      Vibed with{' '}
                      <a href="https://shakespeare.diy" className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">
                        Shakespeare
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <aside className="hidden min-h-[calc(100vh-4rem)] w-72 flex-col justify-between rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6 backdrop-blur xl:flex">
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300/80">nodestr</p>
              </div>
              <h1 className="text-base font-semibold">Lightning Node Identity</h1>
            </div>
            <nav className="space-y-2 text-sm">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-4 py-2 text-left transition',
                    activeSection === id
                      ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {activeSection === id && (
                    <span className="text-[10px] uppercase text-emerald-700 dark:text-emerald-300">Now</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              {currentUser ? (
                <>
                  <AccountSwitcher onClick={handleProfileClick} />
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </>
              ) : (
                <Button className="w-full justify-start" onClick={handleLogin}>
                  <PlugZap className="mr-2 h-4 w-4" />
                  Log in
                </Button>
              )}
            </div>
            <div className="space-y-4 text-xs text-slate-500 dark:text-slate-400">
              <p className="leading-relaxed">
                Vibed with{' '}
                <a href="https://shakespeare.diy" className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">
                  Shakespeare
                </a>
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          <header className="rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-emerald-100 via-slate-50 to-white dark:from-emerald-500/20 dark:via-slate-900/80 dark:to-slate-950 p-8 shadow-2xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold">Work in progress</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">This area is under construction and will change in later phases.</p>
              </div>
            </div>
            <LoginDialog
              isOpen={loginOpen}
              onClose={() => setLoginOpen(false)}
              onLogin={() => {
                setLoginOpen(false);
              }}
            />
          </header>

           {activeSection === 'home' && (
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
                    We couldn’t load CLIP events from your relays. Try again in a moment.
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
                            // Fallback to hex if encoding fails
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
          )}

          {activeSection === 'search' && (
            <section className="grid gap-6">
              <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Search</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700 dark:text-slate-200">
                  Lightning node discovery and operator resolution land in Phase 4.
                </CardContent>
              </Card>
            </section>
          )}

          {activeSection === 'publish' && (
            <section className="grid gap-6">
              <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Publish</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700 dark:text-slate-200">
                  Node announcement and info publishing arrive in Phase 6.
                </CardContent>
              </Card>
            </section>
          )}

          {activeSection === 'dms' && (
            <section className="grid gap-6">
              <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">DMs</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700 dark:text-slate-200">
                  Operator-only DMs will activate in Phase 9.
                </CardContent>
              </Card>
            </section>
          )}

          {activeSection === 'settings' && (
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
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
