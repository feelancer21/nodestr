import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Home, Info, Menu, MessageCircle, PlugZap, Search, Settings, Star, Github } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AccountSwitcher } from '@/components/auth/AccountSwitcher';
import { SearchBanner } from '@/components/search/SearchBanner';
import { useSearch } from '@/hooks/useSearch';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { useAuthor } from '@/hooks/useAuthor';
import { cn, pubkeyToColor } from '@/lib/utils';
import { genUserName } from '@/lib/genUserName';
import { useUnreadSafe } from '@/hooks/useUnread';
import { useIsMobile } from '@/hooks/useIsMobile';
import LoginDialog from '@/components/auth/LoginDialog';
import SignupDialog from '@/components/auth/SignupDialog';

function NostrIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 875 875" fill="none" stroke="currentColor" strokeMiterlimit={10} strokeWidth={45} className={className}>
      <path d="m684.72,485.57c.22,12.59-11.93,51.47-38.67,81.3-26.74,29.83-56.02,20.85-58.42,20.16s-3.09-4.46-7.89-3.77-9.6,6.17-18.86,7.2-17.49,1.71-26.06-1.37c-4.46.69-5.14.71-7.2,2.24s-17.83,10.79-21.6,11.47c0,7.2-1.37,44.57,0,55.89s3.77,25.71,7.54,36c3.77,10.29,2.74,10.63,7.54,9.94s13.37.34,15.77,4.11c2.4,3.77,1.37,6.51,5.49,8.23s60.69,17.14,99.43,19.2c26.74.69,42.86,2.74,52.12,19.54,1.37,7.89,7.54,13.03,11.31,14.06s8.23,2.06,12,5.83,1.03,8.23,5.49,11.66c4.46,3.43,14.74,8.57,25.37,13.71,10.63,5.14,15.09,13.37,15.77,16.11s1.71,10.97,1.71,10.97c0,0-8.91,0-10.97-2.06s-2.74-5.83-2.74-5.83c0,0-6.17,1.03-7.54,3.43s.69,2.74-7.89.69-11.66-3.77-18.17-8.57c-6.51-4.8-16.46-17.14-25.03-16.8,4.11,8.23,5.83,8.23,10.63,10.97s8.23,5.83,8.23,5.83l-7.2,4.46s-4.46,2.06-14.74-.69-11.66-4.46-12.69-10.63,0-9.26-2.74-14.4-4.11-15.77-22.29-21.26c-18.17-5.49-66.52-21.26-100.12-24.69s-22.63-2.74-28.11-1.37-15.77,4.46-26.4-1.37c-10.63-5.83-16.8-13.71-17.49-20.23s-1.71-10.97,0-19.2,3.43-19.89,1.71-26.74-14.06-55.89-19.89-64.12c-13.03,1.03-50.74-.69-50.74-.69,0,0-2.4-.69-17.49,5.83s-36.48,13.76-46.77,19.93-14.4,9.7-16.12,13.13c.12,3-1.23,7.72-2.79,9.06s-12.48,2.42-12.48,2.42c0,0-5.85,5.86-8.25,9.97-6.86,9.6-55.2,125.14-66.52,149.83-13.54,32.57-9.77,27.43-37.71,27.43s-8.06.3-8.06.3c0,0-12.34,5.88-16.8,5.88s-18.86-2.4-26.4,0-16.46,9.26-23.31,10.29-4.95-1.34-8.38-3.74c-4-.21-14.27-.12-14.27-.12,0,0,1.74-6.51,7.91-10.88,8.23-5.83,25.37-16.11,34.63-21.26s17.49-7.89,23.31-9.26,18.51-6.17,30.51-9.94,19.54-8.23,29.83-31.54c10.29-23.31,50.4-111.43,51.43-116.23.63-2.96,3.73-6.48,4.8-15.09.66-5.35-2.49-13.04,1.71-22.63,10.97-25.03,21.6-20.23,26.4-20.23s17.14.34,26.4-1.37,15.43-2.74,24.69-7.89,11.31-8.91,11.31-8.91l-19.89-3.43s-18.51.69-25.03-4.46-15.43-15.77-15.43-15.77l-7.54-7.2,1.03,8.57s-5.14-8.91-6.51-10.29-8.57-6.51-11.31-11.31-7.54-25.03-7.54-25.03l-6.17,13.03-1.71-18.86-5.14,7.2-2.74-16.11-4.8,8.23-3.43-14.4-5.83,4.46-2.4-10.29-5.83-3.43s-14.06-9.26-16.46-9.6-4.46,3.43-4.46,3.43l1.37,12-12.2-6.27-7-11.9s2.36,4.01-9.62,7.53c-20.55,0-21.89-2.28-24.93-3.94-1.31-6.56-5.57-10.11-5.57-10.11h-20.57l-.34-6.86-7.89,3.09.69-10.29h-14.06l1.03-11.31h-8.91s3.09-9.26,25.71-22.97,25.03-16.46,46.29-17.14c21.26-.69,32.91,2.74,46.29,8.23s38.74,13.71,43.89,17.49c11.31-9.94,28.46-19.89,34.29-19.89,1.03-2.4,6.19-12.33,17.96-17.6,35.31-15.81,108.13-34,131.53-35.54,31.2-2.06,7.89-1.37,39.09,2.06,31.2,3.43,54.17,7.54,69.6,12.69,12.58,4.19,25.03,9.6,34.29,2.06,4.33-1.81,11.81-1.34,17.83-5.14,30.69-25.09,34.72-32.35,43.63-41.95s20.14-24.91,22.54-45.14,4.46-58.29-10.63-88.12-28.8-45.26-34.63-69.26c-5.83-24-8.23-61.03-6.17-73.03,2.06-12,5.14-22.29,6.86-30.51s9.94-14.74,19.89-16.46c9.94-1.71,17.83,1.37,22.29,4.8,4.46,3.43,11.65,6.28,13.37,10.29.34,1.71-1.37,6.51,8.23,8.23,9.6,1.71,16.05,4.16,16.05,4.16,0,0,15.64,4.29,3.11,7.73-12.69,2.06-20.52-.71-24.29,1.69s-7.21,10.08-9.61,11.1-7.2.34-12,4.11-9.6,6.86-12.69,14.4-5.49,15.77-3.43,26.74,8.57,31.54,14.4,43.2c5.83,11.66,20.23,40.8,24.34,47.66s15.77,29.49,16.8,53.83,1.03,44.23,0,54.86-10.84,51.65-35.53,85.94c-8.16,14.14-23.21,31.9-24.67,35.03-1.45,3.13-3.02,4.88-1.61,7.65,4.62,9.05,12.87,22.13,14.71,29.22,2.29,6.64,6.99,16.13,7.22,28.72Z" />
    </svg>
  );
}

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/about', label: 'About', icon: Info },
  { path: '/dms', label: 'DMs', icon: MessageCircle },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

export function MobileHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser } = useLoggedInAccounts();
  const { reset: resetSearch } = useSearch();
  const { totalUnread } = useUnreadSafe();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Detect if we're in a DM chat (on /dms with ?to= param)
  // Only show DM chat header on mobile (< 768px) where conversation list is hidden
  const dmChatPubkey = (isMobile && location.pathname === '/dms') ? searchParams.get('to') : null;

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
    if (path === '/about' && location.pathname.startsWith('/about')) return true;
    return false;
  };

  const handleNavClick = (path: string) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(path);
    }
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
        {dmChatPubkey ? (
          <DMChatHeaderContent pubkey={dmChatPubkey} />
        ) : (
        <>
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
                      {path === '/dms' && totalUnread > 0 && (
                        <span className="bg-primary text-primary-foreground rounded-full text-xs min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center font-medium">
                          {totalUnread}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Fixed bottom section - always visible */}
              <div className="shrink-0 pt-6 space-y-6 border-t border-slate-200 dark:border-white/10 mt-auto">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  {currentUser ? (
                    <AccountSwitcher
                      onAddAccountClick={() => {
                        setLoginOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      onNavigate={() => setMobileMenuOpen(false)}
                    />
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
                <div className="space-y-4 text-xs text-slate-500 dark:text-slate-400">
                  <p className="leading-relaxed">
                    Vibed with{' '}
                    <a href="https://shakespeare.diy" className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">
                      Shakespeare
                    </a>
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://github.com/feelancer21/nodestr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                      title="GitHub"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                    <a
                      href="https://nostree.me/feelancer21@iris.to"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                      title="Nostr"
                    >
                      <NostrIcon className="h-4 w-4" />
                    </a>
                  </div>
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
        </>
        )}
      </header>

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
        onComplete={(pubkey) => {
          navigate(`/profile/${nip19.npubEncode(pubkey)}`);
          setMobileMenuOpen(false);
        }}
      />
    </>
  );
}

// --- DM Chat Header for Mobile ---

function DMChatHeaderContent({ pubkey }: { pubkey: string }) {
  const navigate = useNavigate();
  const author = useAuthor(pubkey);
  const displayName = author.data?.metadata?.name || genUserName(pubkey);
  const picture = author.data?.metadata?.picture;
  const avatarColor = pubkeyToColor(pubkey);
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <button
      onClick={() => navigate(`/profile/${nip19.npubEncode(pubkey)}`)}
      className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={picture} alt={displayName} />
        <AvatarFallback
          style={{ backgroundColor: avatarColor }}
          className="text-white font-bold text-xs"
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="font-semibold text-sm truncate">{displayName}</span>
    </button>
  );
}
