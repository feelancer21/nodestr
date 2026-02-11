import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Home, MessageCircle, PlugZap, Settings, Star, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQueryClient } from '@tanstack/react-query';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { useLoginActions } from '@/hooks/useLoginActions';
import { cn, pubkeyToColor } from '@/lib/utils';
import { genUserName } from '@/lib/genUserName';
import { useUnreadSafe } from '@/contexts/UnreadContext';
import LoginDialog from '@/components/auth/LoginDialog';
import SignupDialog from '@/components/auth/SignupDialog';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dms', label: 'DMs', icon: MessageCircle },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, otherUsers, setLogin } = useLoggedInAccounts();
  const loginActions = useLoginActions();
  const queryClient = useQueryClient();
  const { totalUnread } = useUnreadSafe();
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const getDisplayName = (pubkey: string, name?: string): string => {
    return name ?? genUserName(pubkey);
  };

  const isActive = (path: string) => {
    if (location.pathname === path) return true;
    if (path === '/' && (
      location.pathname.startsWith('/profile/') ||
      location.pathname.startsWith('/p/')
    )) return true;
    return false;
  };

  const handleNavClick = (path: string) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden sticky top-8 h-[calc(100vh-4rem)] w-64 flex-shrink-0 flex-col justify-between rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6 backdrop-blur xl:flex self-start overflow-y-auto">
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300/80">nodestr</p>
            </div>
            <h1 className="text-base font-semibold">Lightning Nodes on Nostr</h1>
          </div>
          <nav className="space-y-2 text-sm">
            {navItems.map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                onClick={() => handleNavClick(path)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-4 py-2 text-left transition',
                  isActive(path)
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {path === '/dms' && totalUnread > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full text-xs min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center font-medium">
                    {totalUnread}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            {currentUser ? (
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/profile/${nip19.npubEncode(currentUser.pubkey)}`)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-all w-full text-foreground"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={currentUser.metadata.picture} alt={getDisplayName(currentUser.pubkey, currentUser.metadata.name)} />
                    <AvatarFallback
                      style={{ backgroundColor: pubkeyToColor(currentUser.pubkey) }}
                      className="text-white font-bold text-sm"
                    >
                      {getDisplayName(currentUser.pubkey, currentUser.metadata.name).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left truncate">
                    <p className="font-medium text-sm truncate">{getDisplayName(currentUser.pubkey, currentUser.metadata.name)}</p>
                  </div>
                </button>
                {otherUsers.length > 0 && (
                  <div className="space-y-1 px-1">
                    {otherUsers.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setLogin(account.id);
                          queryClient.removeQueries();
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-all w-full text-foreground"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={account.metadata.picture} alt={getDisplayName(account.pubkey, account.metadata.name)} />
                          <AvatarFallback
                            style={{ backgroundColor: pubkeyToColor(account.pubkey) }}
                            className="text-white font-bold text-xs"
                          >
                            {getDisplayName(account.pubkey, account.metadata.name).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate">{getDisplayName(account.pubkey, account.metadata.name)}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 px-1">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add account</span>
                  </button>
                  <button
                    onClick={() => {
                      loginActions.logout();
                      queryClient.removeQueries();
                    }}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            ) : (
              <Button className="w-full justify-start" onClick={() => setLoginOpen(true)}>
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

      <LoginDialog
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={() => setLoginOpen(false)}
        onSwitchToSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
      />

      <SignupDialog
        isOpen={signupOpen}
        onClose={() => setSignupOpen(false)}
      />
    </>
  );
}
