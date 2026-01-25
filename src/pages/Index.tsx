import { useMemo, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import { Menu, PlugZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { RelayListManager } from '@/components/RelayListManager';
import LoginDialog from '@/components/auth/LoginDialog';
import { AccountSwitcher } from '@/components/auth/AccountSwitcher';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { genUserName } from '@/lib/genUserName';

const navItems = ['Home', 'Search', 'Publish', 'DMs', 'Settings'];

const Index = () => {
  useSeoMeta({
    title: 'nodestr — Lightning Operators on Nostr',
    description: 'nodestr is a browser-only Nostr client for Lightning node operators.',
  });

  const [loginOpen, setLoginOpen] = useState(false);
  const { currentUser } = useLoggedInAccounts();

  const displayProfile = useMemo(() => {
    if (!currentUser) return null;
    const name = currentUser.metadata.name ?? genUserName(currentUser.pubkey);
    const npub = nip19.npubEncode(currentUser.pubkey);
    const shortNpub = `${npub.slice(0, 12)}…${npub.slice(-6)}`;
    return { name, npub: shortNpub };
  }, [currentUser]);

  const handleLogin = async () => {
    setLoginOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <div className="fixed left-4 top-6 z-40 xl:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-white/10 bg-white/10 text-slate-100 shadow-lg shadow-black/30"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-52 border-white/10 bg-slate-950 text-slate-100 sm:w-60">
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">nodestr</p>
                    <h1 className="text-base font-semibold">Lightning Node Identity</h1>
                  </div>
                  <nav className="space-y-2 text-sm">
                    {navItems.map((item) => (
                      <button
                        key={item}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-4 py-2 text-left transition',
                          item === 'Home'
                            ? 'bg-white/10 text-white'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        <span>{item}</span>
                        {item === 'Home' && <span className="text-[10px] uppercase text-emerald-300">Now</span>}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                    {displayProfile ? (
                      <>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active profile</p>
                          <p className="text-sm font-medium text-slate-100">{displayProfile.name}</p>
                          <p className="text-xs font-mono text-slate-400">{displayProfile.npub}</p>
                        </div>
                        <AccountSwitcher onAddAccountClick={() => setLoginOpen(true)} />
                      </>
                    ) : (
                      <Button className="w-full justify-start" onClick={handleLogin}>
                        <PlugZap className="mr-2 h-4 w-4" />
                        Log in
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 text-xs text-slate-400">
                    <p className="leading-relaxed">
                      Vibed with{' '}
                      <a href="https://shakespeare.diy" className="text-emerald-300 hover:text-emerald-200">
                        Shakespeare
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <aside className="hidden w-72 flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur xl:flex">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">nodestr</p>
              <h1 className="text-base font-semibold">Lightning Node Identity</h1>
            </div>
            <nav className="space-y-2 text-sm">
              {navItems.map((item) => (
                <button
                  key={item}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-4 py-2 text-left transition',
                    item === 'Home'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <span>{item}</span>
                  {item === 'Home' && <span className="text-[10px] uppercase text-emerald-300">Now</span>}
                </button>
              ))}
            </nav>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              {displayProfile ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active profile</p>
                    <p className="text-sm font-medium text-slate-100">{displayProfile.name}</p>
                    <p className="text-xs font-mono text-slate-400">{displayProfile.npub}</p>
                  </div>
                  <AccountSwitcher onAddAccountClick={() => setLoginOpen(true)} />
                </>
              ) : (
                <Button className="w-full justify-start" onClick={handleLogin}>
                  <PlugZap className="mr-2 h-4 w-4" />
                  Log in
                </Button>
              )}
            </div>
            <div className="space-y-4 text-xs text-slate-400">
              <p className="leading-relaxed">
                Vibed with{' '}
                <a href="https://shakespeare.diy" className="text-emerald-300 hover:text-emerald-200">
                  Shakespeare
                </a>
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 via-slate-900/80 to-slate-950 p-8 shadow-2xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <p className="text-sm text-emerald-200">Phase 1 Foundation</p>
                <h2 className="text-3xl font-semibold">Node Operator Identity</h2>
                <p className="text-sm text-slate-300">
                  Connect your NIP-07 signer, manage relays locally, and keep the client ready for CLIP flows.
                </p>
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

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-400">Home</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-200">
                Feed will appear here in Phase 2. Verified CLIP events only.
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-400">Search</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-200">
                Lightning node discovery and operator resolution land in Phase 4.
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-400">Publish</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-200">
                Node announcement and info publishing arrive in Phase 6.
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-400">DMs</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-200">
                Operator-only DMs will activate in Phase 9.
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5 text-slate-100 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-400">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-sm text-slate-200">
                <div>
                  <p className="text-sm text-slate-300">
                    Relays are stored locally in this browser. Changes apply immediately for new connections.
                  </p>
                </div>
                <RelayListManager />
                <div className="text-xs text-slate-400">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Info:</span>{' '}
                  Relay list is not synced to Nostr in Phase 1.
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
