import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RelayHealthInfo } from './dummyRelayData';

interface RelayListHeaderProps {
  relays: RelayHealthInfo[];
  onTestAll: () => void;
}

function getHealthColor(connectedCount: number, totalCount: number): string {
  if (totalCount === 0) return 'bg-gray-400';
  const ratio = connectedCount / totalCount;
  if (ratio > 0.5) return 'bg-emerald-500';
  if (ratio > 0) return 'bg-amber-500';
  return 'bg-red-500';
}

function getHealthLabel(connectedCount: number, totalCount: number): string {
  if (totalCount === 0) return 'No relays';
  const ratio = connectedCount / totalCount;
  if (ratio > 0.5) return 'Healthy';
  if (ratio > 0) return 'Degraded';
  return 'Offline';
}

export function RelayListHeader({ relays, onTestAll }: RelayListHeaderProps) {
  const connectedCount = relays.filter(r => r.status === 'connected').length;
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
        <div className="flex items-center gap-1.5">
          <div
            className={`size-2 rounded-full ${getHealthColor(connectedCount, relays.length)}`}
          />
          <span className="text-xs text-muted-foreground">
            {getHealthLabel(connectedCount, relays.length)}
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={onTestAll}
      >
        <Activity className="h-3 w-3 mr-1.5" />
        Test All
      </Button>
    </div>
  );
}
