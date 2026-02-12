import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, UserPlus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useQueryClient } from '@tanstack/react-query';
import { useLoggedInAccounts, type Account } from '@/hooks/useLoggedInAccounts';
import { useLoginActions } from '@/hooks/useLoginActions';
import { genUserName } from '@/lib/genUserName';
import { pubkeyToColor } from '@/lib/utils';

interface AccountSwitcherProps {
  onAddAccountClick?: () => void;
  onNavigate?: () => void;
}

export function AccountSwitcher({ onAddAccountClick, onNavigate }: AccountSwitcherProps) {
  const { currentUser, otherUsers, setLogin } = useLoggedInAccounts();
  const login = useLoginActions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!currentUser) return null;

  const getDisplayName = (account: Account): string => {
    return account.metadata.name ?? genUserName(account.pubkey);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className='flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-all w-full text-foreground'
        >
          <Avatar className='w-10 h-10'>
            <AvatarImage src={currentUser.metadata.picture} alt={getDisplayName(currentUser)} />
            <AvatarFallback
              style={{ backgroundColor: pubkeyToColor(currentUser.pubkey) }}
              className="text-white font-bold text-sm"
            >
              {getDisplayName(currentUser).charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 text-left truncate'>
            <p className='font-medium text-sm truncate'>{getDisplayName(currentUser)}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => {
            navigate(`/profile/${nip19.npubEncode(currentUser.pubkey)}`);
            onNavigate?.();
          }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <User className="w-4 h-4" />
          <span>View profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {otherUsers.length > 0 && (
          <>
            {otherUsers.map((account) => {
              const avatarColor = pubkeyToColor(account.pubkey);
              return (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => {
                    setLogin(account.id);
                    queryClient.removeQueries();
                    navigate(`/profile/${nip19.npubEncode(account.pubkey)}`);
                    onNavigate?.();
                  }}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={account.metadata.picture} alt={getDisplayName(account)} />
                    <AvatarFallback
                      style={{ backgroundColor: avatarColor }}
                      className="text-white font-bold text-xs"
                    >
                      {getDisplayName(account).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{getDisplayName(account)}</span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={onAddAccountClick}
          className="flex items-center gap-3 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add another account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            login.logout();
            queryClient.removeQueries();
          }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
