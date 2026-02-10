import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { normalizeRelayUrl } from '@/lib/relayHealthStore';

interface RelayAddFormProps {
  existingUrls: string[];
  onAdd: (url: string) => void;
}

function isValidRelayUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const normalized = normalizeRelayUrl(trimmed);
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'wss:' || parsed.protocol === 'ws:';
  } catch {
    return false;
  }
}

export function RelayAddForm({ existingUrls, onAdd }: RelayAddFormProps) {
  const [newRelayUrl, setNewRelayUrl] = useState('');
  const { toast } = useToast();

  const handleAdd = () => {
    if (!isValidRelayUrl(newRelayUrl)) {
      toast({
        title: 'Invalid relay URL',
        description:
          'Please enter a valid relay URL (e.g., wss://relay.example.com)',
        variant: 'destructive',
      });
      return;
    }

    const normalized = normalizeRelayUrl(newRelayUrl);

    if (existingUrls.includes(normalized)) {
      toast({
        title: 'Relay already exists',
        description: 'This relay is already in your list.',
        variant: 'destructive',
      });
      return;
    }

    onAdd(normalized);
    setNewRelayUrl('');
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Label htmlFor="new-relay-url" className="sr-only">
          Relay URL
        </Label>
        <Input
          id="new-relay-url"
          placeholder="wss://relay.example.com"
          value={newRelayUrl}
          onChange={(e) => setNewRelayUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
      </div>
      <Button
        onClick={handleAdd}
        disabled={!newRelayUrl.trim()}
        variant="outline"
        size="sm"
        className="h-10 shrink-0"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Relay
      </Button>
    </div>
  );
}
