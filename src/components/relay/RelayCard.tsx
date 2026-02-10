import { useState } from 'react';
import { ChevronRight, Settings, Pin, PinOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RelayNip11Details } from './RelayNip11Details';
import type { RelayHealthInfo } from './dummyRelayData';

interface RelayCardProps {
  relay: RelayHealthInfo;
  onToggleRead: (url: string) => void;
  onToggleWrite: (url: string) => void;
  onTogglePin: (url: string) => void;
  onRemove: (url: string) => void;
  canRemove: boolean;
}

const STATUS_COLORS: Record<RelayHealthInfo['status'], string> = {
  connected: 'bg-emerald-500',
  slow: 'bg-amber-500',
  unreachable: 'bg-red-500',
  unknown: 'bg-gray-400',
};

const STATUS_TOOLTIPS: Record<RelayHealthInfo['status'], string> = {
  connected: 'Connected — relay is responding normally',
  slow: 'Slow — latency exceeds 200ms. Auto relays may be disconnected; pinned relays stay connected.',
  unreachable: 'Unreachable — relay is not responding. Auto relays will be disconnected; pinned relays keep retrying.',
  unknown: 'Unknown — not yet tested',
};

function getLatencyColor(ms: number): string {
  if (ms < 200) return 'text-emerald-500';
  if (ms < 500) return 'text-amber-500';
  return 'text-red-500';
}

function renderRelayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'wss:') {
      return parsed.pathname === '/' ? parsed.host : parsed.host + parsed.pathname;
    }
    return parsed.href;
  } catch {
    return url;
  }
}

export function RelayCard({
  relay,
  onToggleRead,
  onToggleWrite,
  onTogglePin,
  onRemove,
  canRemove,
}: RelayCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const badges = (
    <>
      {relay.latencyMs != null && (
        <span className={`text-xs font-mono ${getLatencyColor(relay.latencyMs)}`}>
          {relay.latencyMs}ms
        </span>
      )}
      {relay.read && (
        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 leading-none">
          R
        </Badge>
      )}
      {relay.write && (
        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 leading-none">
          W
        </Badge>
      )}
      <Badge
        variant={relay.isPinned ? 'default' : 'secondary'}
        className="text-[10px] px-1.5 py-0 h-4 leading-none cursor-help"
        title={
          relay.isPinned
            ? 'Pinned — stays connected regardless of performance. Must be removed manually.'
            : 'Auto — discovered automatically. May be disconnected if performance is poor.'
        }
      >
        {relay.isPinned ? 'Pinned' : 'Auto'}
      </Badge>
      {relay.clipEventsCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {relay.clipEventsCount} CLIP
        </span>
      )}
    </>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-md border border-border bg-muted/20 p-3 space-y-1">
        {/* Row 1: Status + URL + Badges */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`size-2.5 rounded-full shrink-0 cursor-help ${STATUS_COLORS[relay.status]}`}
            title={STATUS_TOOLTIPS[relay.status]}
          />
          <span className="font-mono text-sm truncate flex-1 min-w-0" title={relay.url}>
            {renderRelayUrl(relay.url)}
          </span>
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {badges}
          </div>
        </div>

        {/* Mobile badges row */}
        <div className="flex sm:hidden items-center gap-1.5 pl-[18px]">
          {badges}
        </div>

        {/* Row 2: NIP-11 trigger + Action buttons */}
        <div className="flex items-center justify-between pl-[18px]">
          {relay.nip11 ? (
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
                NIP-11 Details
              </button>
            </CollapsibleTrigger>
          ) : (
            <span className="text-xs text-muted-foreground">No NIP-11 data</span>
          )}

          <div className="flex items-center gap-0.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`read-${relay.url}`} className="text-sm cursor-pointer">
                      Read
                    </Label>
                    <Switch
                      id={`read-${relay.url}`}
                      checked={relay.read}
                      onCheckedChange={() => onToggleRead(relay.url)}
                      className="data-[state=checked]:bg-green-500 scale-75"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`write-${relay.url}`} className="text-sm cursor-pointer">
                      Write
                    </Label>
                    <Switch
                      id={`write-${relay.url}`}
                      checked={relay.write}
                      onCheckedChange={() => onToggleWrite(relay.url)}
                      className="data-[state=checked]:bg-blue-500 scale-75"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTogglePin(relay.url)}
              className="size-6 text-muted-foreground hover:text-foreground"
              title={relay.isPinned ? 'Unpin relay' : 'Pin relay'}
            >
              {relay.isPinned ? (
                <PinOff className="h-3.5 w-3.5" />
              ) : (
                <Pin className="h-3.5 w-3.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(relay.url)}
              className="size-6 text-muted-foreground hover:text-destructive"
              disabled={!canRemove}
              title="Remove relay"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded NIP-11 details */}
        {relay.nip11 && (
          <CollapsibleContent>
            <RelayNip11Details nip11={relay.nip11} />
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}
