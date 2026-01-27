import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/clip/CopyButton';
import { FormattedText } from '@/components/clip/FormattedText';
import { truncateMiddle } from '@/lib/utils';

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
            {payload.contact_info!.map((contact, idx) => (
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
                <div className="flex items-center gap-1">
                  <span className="text-sm text-foreground font-mono">
                    {truncateMiddle(contact.value, 24)}
                  </span>
                  <CopyButton value={contact.value} className="shrink-0" />
                </div>
                {contact.note && (
                  <span className="text-xs text-muted-foreground mt-0.5 break-words [overflow-wrap:anywhere]">
                    {contact.note}
                  </span>
                )}
              </div>
            ))}
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
