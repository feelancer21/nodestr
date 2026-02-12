import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RelayHealthData } from '@/lib/relayHealthStore';

interface EnrichedRelay {
  url: string;
  read: boolean;
  write: boolean;
  health: RelayHealthData | undefined;
}

interface RelayListHeaderProps {
  relays: EnrichedRelay[];
  onTestAll: () => void;
  isProbing: boolean;
}

export function RelayListHeader({ relays, onTestAll, isProbing }: RelayListHeaderProps) {
  const connectedCount = relays.filter(r => r.health?.status === 'connected').length;
  const readCount = relays.filter(r => r.read).length;
  const writeCount = relays.filter(r => r.write).length;

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs">
          {connectedCount} active
        </Badge>
        <span className="text-xs text-muted-foreground">
          {readCount}R {writeCount}W
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={onTestAll}
        disabled={isProbing}
      >
        <Activity className={`h-3 w-3 mr-1.5 ${isProbing ? 'animate-pulse' : ''}`} />
        {isProbing ? 'Testing…' : 'Test All'}
      </Button>
    </div>
  );
}
