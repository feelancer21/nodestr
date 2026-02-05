import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Network } from '@/types/search';

interface NetworkSelectorProps {
  network: Network;
  onNetworkChange: (network: Network) => void;
  className?: string;
}

const NETWORKS: { value: Network; label: string; shortLabel: string }[] = [
  { value: 'mainnet', label: 'Mainnet', shortLabel: 'Main' },
  { value: 'testnet', label: 'Testnet', shortLabel: 'Test' },
  { value: 'testnet4', label: 'Testnet4', shortLabel: 'T4' },
  { value: 'signet', label: 'Signet', shortLabel: 'Sig' },
];

export function NetworkSelector({
  network,
  onNetworkChange,
  className,
}: NetworkSelectorProps) {
  const currentNetwork = NETWORKS.find((n) => n.value === network) || NETWORKS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
          'bg-muted hover:bg-muted/80 transition-colors',
          'text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          className
        )}
      >
        <span className="hidden xxs:inline">{currentNetwork.label}</span>
        <span className="xxs:hidden">{currentNetwork.shortLabel}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[100px]">
        {NETWORKS.map((n) => (
          <DropdownMenuItem
            key={n.value}
            onClick={() => onNetworkChange(n.value)}
            className={cn(
              'cursor-pointer',
              network === n.value && 'bg-accent'
            )}
          >
            {n.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
