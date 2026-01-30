import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/clip/CopyButton';
import { FormattedText } from '@/components/clip/FormattedText';
import { truncateMiddle } from '@/lib/utils';
import { useAuthor } from '@/hooks/useAuthor';

function getContactLink(type: string, value: string): { href: string; external: boolean } | null {
  const typeLower = type.toLowerCase();

  switch (typeLower) {
    case 'nostr': {
      // Could be npub, nprofile, or hex pubkey
      if (value.startsWith('npub1') || value.startsWith('nprofile1')) {
        return { href: `/profile/${value}`, external: false };
      }
      // Try to encode as npub if it's a hex pubkey
      if (/^[0-9a-f]{64}$/i.test(value)) {
        try {
          const npub = nip19.npubEncode(value);
          return { href: `/profile/${npub}`, external: false };
        } catch {
          return null;
        }
      }
      return null;
    }
    case 'email':
      return { href: `mailto:${value}`, external: true };
    case 'website':
    case 'web':
    case 'url':
      return { href: value.startsWith('http') ? value : `https://${value}`, external: true };
    case 'telegram':
    case 'tg':
      return { href: `https://t.me/${value.replace('@', '')}`, external: true };
    case 'twitter':
    case 'x':
      return { href: `https://twitter.com/${value.replace('@', '')}`, external: true };
    case 'github':
    case 'gh':
      return { href: `https://github.com/${value}`, external: true };
    case 'signal':
      return { href: `https://signal.me/#p/${value}`, external: true };
    case 'simplex':
      return { href: `https://simplex.chat/contact#${value}`, external: true };
    default:
      return null;
  }
}

interface ContactInfo {
  type: string;
  value: string;
  note?: string;
  primary?: boolean;
}

interface NodeInfoPayload {
  about?: string;
  min_channel_size_sat?: number;
  max_channel_size_sat?: number;
  contact_info?: ContactInfo[];
  custom_records?: Record<string, unknown>;
}

interface NodeInfoContentProps {
  content: unknown;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extract hex pubkey from npub, nprofile, or hex string
 */
function extractNostrPubkey(value: string): string | null {
  // Already hex
  if (/^[0-9a-f]{64}$/i.test(value)) {
    return value;
  }
  // npub or nprofile
  if (value.startsWith('npub1') || value.startsWith('nprofile1')) {
    try {
      const decoded = nip19.decode(value);
      if (decoded.type === 'npub') {
        return decoded.data;
      }
      if (decoded.type === 'nprofile') {
        return decoded.data.pubkey;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get the npub for copying (convert hex to npub if needed)
 */
function getNostrCopyValue(value: string): string {
  // Already npub or nprofile - use as-is
  if (value.startsWith('npub1') || value.startsWith('nprofile1')) {
    return value;
  }
  // Hex - convert to npub
  if (/^[0-9a-f]{64}$/i.test(value)) {
    try {
      return nip19.npubEncode(value);
    } catch {
      return value;
    }
  }
  return value;
}

interface NostrContactDisplayProps {
  value: string;
  link: { href: string; external: boolean } | null;
}

/**
 * Displays a Nostr contact with resolved username (if available)
 */
function NostrContactDisplay({ value, link }: NostrContactDisplayProps) {
  const pubkey = extractNostrPubkey(value);
  const author = useAuthor(pubkey || '');
  const copyValue = getNostrCopyValue(value);

  // Determine display text: username if available, otherwise truncated value
  const displayText = author.data?.metadata?.name || truncateMiddle(value, 24);
  const isUsername = !!author.data?.metadata?.name;

  const content = link ? (
    <Link
      to={link.href}
      className={`text-sm text-foreground hover:text-muted-foreground transition ${isUsername ? '' : 'font-mono'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {displayText}
    </Link>
  ) : (
    <span className={`text-sm text-foreground ${isUsername ? '' : 'font-mono'}`}>
      {displayText}
    </span>
  );

  return (
    <div className="flex items-center gap-1">
      {content}
      <CopyButton value={copyValue} className="shrink-0" />
    </div>
  );
}

export function NodeInfoContent({ content }: NodeInfoContentProps) {
  // Type guard and cast
  if (typeof content !== 'object' || content === null) {
    return null;
  }

  const payload = content as NodeInfoPayload;

  const hasChannelSizes = payload.min_channel_size_sat != null || payload.max_channel_size_sat != null;
  const hasContactInfo = Array.isArray(payload.contact_info) && payload.contact_info.length > 0;
  const hasCustomRecords =
    payload.custom_records &&
    typeof payload.custom_records === 'object' &&
    Object.keys(payload.custom_records).length > 0;

  if (!payload.about && !hasChannelSizes && !hasContactInfo && !hasCustomRecords) {
    return null;
  }

  return (
    <div className="space-y-4 overflow-hidden">
      {/* About section */}
      {payload.about && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">About</h4>
          <p className="text-sm text-foreground leading-relaxed break-words [overflow-wrap:anywhere]">
            <FormattedText text={payload.about} />
          </p>
        </div>
      )}

      {/* Channel Size section */}
      {hasChannelSizes && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Accepted Channel Sizes</h4>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            {payload.min_channel_size_sat != null && (
              <div className="flex flex-col">
                <span className="text-xs text-label mb-0.5">Minimum</span>
                <span className="text-sm text-foreground font-mono tabular-nums">
                  {payload.min_channel_size_sat.toLocaleString()} sat
                </span>
              </div>
            )}
            {payload.max_channel_size_sat != null && (
              <div className="flex flex-col">
                <span className="text-xs text-label mb-0.5">Maximum</span>
                <span className="text-sm text-foreground font-mono tabular-nums">
                  {payload.max_channel_size_sat.toLocaleString()} sat
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Info section */}
      {hasContactInfo && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {payload.contact_info!.map((contact, idx) => {
              const link = getContactLink(contact.type, contact.value);

              return (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs text-label">
                      {capitalizeFirst(contact.type)}
                    </span>
                    {contact.primary && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        Primary
                      </Badge>
                    )}
                  </div>
                  {contact.type.toLowerCase() === 'nostr' ? (
                    <NostrContactDisplay value={contact.value} link={link} />
                  ) : (
                    <div className="flex items-center gap-1">
                      {link ? (
                        link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-foreground font-mono hover:text-muted-foreground transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncateMiddle(contact.value, 24)}
                          </a>
                        ) : (
                          <Link
                            to={link.href}
                            className="text-sm text-foreground font-mono hover:text-muted-foreground transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncateMiddle(contact.value, 24)}
                          </Link>
                        )
                      ) : (
                        <span className="text-sm text-foreground font-mono">
                          {truncateMiddle(contact.value, 24)}
                        </span>
                      )}
                      <CopyButton value={contact.value} className="shrink-0" />
                    </div>
                  )}
                  {contact.note && (
                    <span className="text-xs text-muted-foreground mt-0.5 break-words [overflow-wrap:anywhere]">
                      {contact.note}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Records section */}
      {hasCustomRecords && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Custom Records</h4>
          <div className="space-y-3">
            {Object.entries(payload.custom_records!).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-label mb-0.5">
                  {key}
                </span>
                <span className="text-sm text-foreground break-words [overflow-wrap:anywhere]">
                  <FormattedText text={String(value)} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
