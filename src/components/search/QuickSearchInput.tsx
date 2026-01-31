import { forwardRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NetworkSelector } from './NetworkSelector';
import type { Network } from '@/types/search';

interface QuickSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  network: Network;
  onNetworkChange: (network: Network) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const QuickSearchInput = forwardRef<HTMLInputElement, QuickSearchInputProps>(
  (
    {
      value,
      onChange,
      network,
      onNetworkChange,
      isLoading = false,
      placeholder = 'Search Lightning nodes...',
      className,
      onFocus,
      onBlur,
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          'relative flex items-center w-full rounded-md border border-input bg-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          className
        )}
      >
        <div className="flex items-center justify-center pl-3 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className={cn(
            'flex-1 h-10 px-3 py-2 text-sm bg-transparent',
            'placeholder:text-muted-foreground',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
        <div className="pr-2">
          <NetworkSelector
            network={network}
            onNetworkChange={onNetworkChange}
          />
        </div>
      </div>
    );
  }
);

QuickSearchInput.displayName = 'QuickSearchInput';
