import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { useLoggedInAccounts, type Account } from '@/hooks/useLoggedInAccounts';
import { genUserName } from '@/lib/genUserName';

interface AccountSwitcherProps {
  onClick?: () => void;
}

export function AccountSwitcher({ onClick }: AccountSwitcherProps) {
  const { currentUser } = useLoggedInAccounts();

  if (!currentUser) return null;

  const getDisplayName = (account: Account): string => {
    return account.metadata.name ?? genUserName(account.pubkey);
  }

  return (
    <button
      onClick={onClick}
      className='flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-all w-full text-foreground'
    >
      <Avatar className='w-10 h-10'>
        <AvatarImage src={currentUser.metadata.picture} alt={getDisplayName(currentUser)} />
        <AvatarFallback>{getDisplayName(currentUser).charAt(0)}</AvatarFallback>
      </Avatar>
      <div className='flex-1 text-left truncate'>
        <p className='font-medium text-sm truncate'>{getDisplayName(currentUser)}</p>
      </div>
    </button>
  );
}