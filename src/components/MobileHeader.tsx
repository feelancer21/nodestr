import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Menu, MessageCircle, PenSquare, PlugZap, Search, Settings, Star, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AccountSwitcher } from '@/components/auth/AccountSwitcher';
import { SearchBanner } from '@/components/search/SearchBanner';
import { useSearch } from '@/contexts/SearchContext';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { nip19 } from 'nostr-tools';
import { cn } from '@/lib/utils';
import LoginDialog from '@/components/auth/LoginDialog';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/publish', label: 'Publish', icon: PenSquare },
  { path: '/dms', label: 'DMs', icon: MessageCircle },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

export function MobileHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, removeLogin } = useLoggedInAccounts();
  const { reset: resetSearch } = useSearch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // Only trigger visibility change if scroll delta is significant (> 10px)
      // and we're not near the top of the page
      if (scrollDelta > 10) {
        if (scrollingDown && currentScrollY > 60) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleSearchIconClick = () => {
    // Clear search state when navigating to search page via icon
    resetSearch();
    navigate('/search');
  };

  return (
    <>
      {/* Mobile/Tablet Top Bar - visible below xl */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 xl:hidden',
          'h-14 px-4 flex items-center justify-between',
          'bg-background/80 backdrop-blur-md border-b border-border/50',
          'transition-transform duration-300 ease-in-out',
          isVisible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-52 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 sm:w-60 flex flex-col">
            <div className="flex flex-col h-full min-h-0">
              {/* Scrollable content area */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-8">
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
                    </button>
                  ))}
                </nav>
              </div>

              {/* Fixed bottom section - always visible */}
              <div className="shrink-0 pt-6 space-y-6 border-t border-slate-200 dark:border-white/10 mt-auto">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  {currentUser ? (
                    <>
                      <AccountSwitcher onClick={() => {
                        handleProfileClick();
                        setMobileMenuOpen(false);
                      }} />
                      <Button variant="outline" className="w-full" onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full justify-start" onClick={() => {
                      setLoginOpen(true);
                      setMobileMenuOpen(false);
                    }}>
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
                    <br />
                    commit [<a href={`https://github.com/feelancer21/nodestr/commit/${__COMMIT_HASH__}`} className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200" target="_blank" rel="noopener noreferrer">{__COMMIT_HASH__}</a>]
                  </p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Right side - Tablet (sm+): SearchBanner, Mobile (<sm): Search icon */}
        <div className="flex-1 flex justify-end">
          {/* Tablet: SearchBanner (always visible, dropdown disabled on /search via SearchContext) */}
          <div className="hidden sm:block flex-1 max-w-xs">
            <SearchBanner variant="header" placeholder="Search..." />
          </div>

          {/* Mobile: Search icon only */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden h-10 w-10 rounded-full"
            onClick={handleSearchIconClick}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <LoginDialog
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={() => setLoginOpen(false)}
      />
    </>
  );
}
