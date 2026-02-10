import type { Nip11Info } from '@/lib/relayHealthStore';

interface RelayNip11DetailsProps {
  nip11: Nip11Info;
}

export function RelayNip11Details({ nip11 }: RelayNip11DetailsProps) {
  return (
    <div className="space-y-1.5 text-sm text-foreground border-t border-border pt-3 mt-2">
      {nip11.name && (
        <div>
          <span className="text-xs text-label">Name:</span>{' '}
          {nip11.name}
        </div>
      )}
      {nip11.description && (
        <div>
          <span className="text-xs text-label">Description:</span>{' '}
          {nip11.description}
        </div>
      )}
      {nip11.software && (
        <div>
          <span className="text-xs text-label">Software:</span>{' '}
          {nip11.software}{nip11.version ? ` v${nip11.version}` : ''}
        </div>
      )}
      {nip11.supported_nips && nip11.supported_nips.length > 0 && (
        <div>
          <span className="text-xs text-label">Supported NIPs:</span>{' '}
          {nip11.supported_nips.join(', ')}
        </div>
      )}
      {nip11.limitation && Object.keys(nip11.limitation).length > 0 && (
        <div>
          <span className="text-xs text-label">Limitations:</span>{' '}
          {Object.entries(nip11.limitation).map(([k, v]) => `${k}: ${String(v)}`).join(', ')}
        </div>
      )}
      {nip11.contact && (
        <div>
          <span className="text-xs text-label">Contact:</span>{' '}
          {nip11.contact}
        </div>
      )}
    </div>
  );
}
