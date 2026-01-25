import { useEffect, useMemo, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import { AlertCircle, CheckCircle2, Loader2, Menu, PlugZap, X } from 'lucide-react';
import { useNostrLogin } from '@nostrify/react/login';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { RelayListManager } from '@/components/RelayListManager';
import LoginDialog from '@/components/auth/LoginDialog';
import { useLoginActions } from '@/hooks/useLoginActions';

const navItems = ['Home', 'Search', 'Publish', 'DMs', 'Settings'];

type ConnectionState = 'logged_out' | 'connecting' | 'connected' | 'error';

const Index = () => {
  useSeoMeta({
    title: 'nodestr — Lightning Operators on Nostr',
    description: 'nodestr is a browser-only Nostr client for Lightning node operators.',
  });

  const { logins } = useNostrLogin();
  const { extension, logout } = useLoginActions();
  const [connectionState, setConnectionState] = useState<ConnectionState>('logged_out');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [defaultLoginTab, setDefaultLoginTab] = useState<'key' | 'bunker'>('key');

  const hasExtension = typeof window !== 'undefined' && 'nostr' in window;

  const activeNpub = useMemo(() => {
    const pubkey = logins[0]?.pubkey;
    if (!pubkey) return null;
    try {
      return nip19.npubEncode(pubkey);
    } catch {
      return null;
    }
  }, [logins]);

  useEffect(() => {
    if (logins.length > 0) {
      setConnectionState('connected');
      setErrorMessage('');
      return;
    }
    setConnectionState('logged_out');
  }, [logins]);

  const handleExtensionLogin = async () => {
    if (!hasExtension) {
      setConnectionState('error');
      setErrorMessage('NIP-07 extension not found');
      return;
    }
    setConnectionState('connecting');
    setErrorMessage('');
    try {
      await extension();
      setConnectionState('connected');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Permission denied';
      setConnectionState('error');
      setErrorMessage(message);
    }
  };

  const handleDisconnect = async () => {
    await logout();
    setConnectionState('logged_out');
  };

  const displayNpub = activeNpub
    ? `${activeNpub.slice(0, 12)}…${activeNpub.slice(-6)}`
    : null;

  const stateLabel = (() => {
    if (connectionState === 'connecting') return 'Connecting…';
    if (connectionState === 'connected') return 'Connected';
    if (connectionState === 'error') return `Connection failed: ${errorMessage || 'Unknown error'}`;
    return 'Logged out';
  })();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <div className="xl:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-white/10 bg-white/10 text-slate-100">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-white/10 bg-slate-950 text-slate-100">
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">nodestr</p>
                    <h1 className="text-2xl font-semibold">Operator Console</h1>
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
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-medium">Log in</p>
                    <p className="mt-2 text-xs text-slate-300">
                      Access your account securely with your preferred method.
                    </p>
                    <div className="mt-4 space-y-2">
                <Button
                  className="w-full justify-start"
                  onClick={handleExtensionLogin}
                  disabled={!hasExtension || connectionState === 'connecting'}
                >
                  Extension
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setDefaultLoginTab('key');
                    setLoginOpen(true);
                  }}
                >
                  Nsec
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setDefaultLoginTab('bunker');
                    setLoginOpen(true);
                  }}
                >
                  Bunker
                </Button>

                    </div>
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
              <h1 className="text-2xl font-semibold">Operator Console</h1>
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
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium">Log in</p>
              <p className="mt-2 text-xs text-slate-300">
                Access your account securely with your preferred method.
              </p>
              <div className="mt-4 space-y-2">
                <Button
                  className="w-full justify-start"
                  onClick={handleExtensionLogin}
                  disabled={!hasExtension || connectionState === 'connecting'}
                >
                  Extension
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setDefaultLoginTab('key');
                    setLoginOpen(true);
                  }}
                >
                  Nsec
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setDefaultLoginTab('bunker');
                    setLoginOpen(true);
                  }}
                >
                  Bunker
                </Button>
              </div>
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
                <h2 className="text-3xl font-semibold">Nostr Identity & Relay Control</h2>
                <p className="text-sm text-slate-300">
                  Connect your NIP-07 signer, manage relays locally, and keep the client ready for CLIP flows.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-wide text-slate-200">
                  {connectionState === 'connecting' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : connectionState === 'connected' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <AlertCircle className={cn('h-4 w-4', connectionState === 'error' ? 'text-rose-400' : 'text-slate-400')} />
                  )}
                  <span>{stateLabel}</span>
                </div>
                {connectionState === 'connected' ? (
                  <Button variant="outline" size="sm" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setDefaultLoginTab('key');
                      setLoginOpen(true);
                    }}
                  >
                    <PlugZap className="mr-2 h-4 w-4" />
                    Log in
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active Nostr</p>
                <p className="mt-2 font-mono text-sm text-slate-100">
                  {displayNpub ?? 'npub1… (not connected)'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Extension Status</p>
                <p className="mt-2 text-sm text-slate-200">
                  {hasExtension ? 'NIP-07 extension detected' : 'Waiting for Nostr extension…'}
                </p>
              </div>
              {connectionState === 'error' && (
                <div className="md:col-span-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {errorMessage || 'Connection failed. Please try again.'}
                </div>
              )}
            </div>
            <LoginDialog
              isOpen={loginOpen}
              onClose={() => setLoginOpen(false)}
              onLogin={() => {
                setLoginOpen(false);
                setConnectionState('connected');
              }}
              defaultTab={defaultLoginTab}
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
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <X className="h-4 w-4" />
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
