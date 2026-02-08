import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, PlugZap, Settings, Star, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountSwitcher } from '@/components/auth/AccountSwitcher';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { nip19 } from 'nostr-tools';
import { cn } from '@/lib/utils';
import { DUMMY_TOTAL_UNREAD } from '@/lib/dmDummyData';
import LoginDialog from '@/components/auth/LoginDialog';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dms', label: 'DMs', icon: MessageCircle },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, removeLogin } = useLoggedInAccounts();
  const [loginOpen, setLoginOpen] = useState(false);

  const isActive = (path: string) => {
    if (location.pathname === path) return true;
    if (path === '/' && (
      location.pathname.startsWith('/profile/') ||
      location.pathname.startsWith('/p/')
    )) return true;
    return false;
  };

  const handleProfileClick = () => {
    if (currentUser) {
      navigate(`/profile/${nip19.npubEncode(currentUser.pubkey)}`);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      removeLogin(currentUser.id);
      navigate('/');
    }
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
                {path === '/dms' && DUMMY_TOTAL_UNREAD > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full text-xs min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center font-medium">
                    {DUMMY_TOTAL_UNREAD}
                  </span>
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
      />
    </>
  );
}
