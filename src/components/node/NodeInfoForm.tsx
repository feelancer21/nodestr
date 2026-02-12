import { useState, useMemo, useCallback } from 'react';
import { ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn, formatNumber } from '@/lib/utils';

// --- Types ---

interface NodeInfoPayload {
  about?: string;
  min_channel_size_sat?: number;
  max_channel_size_sat?: number;
  contact_info?: ContactInfoEntry[];
  custom_records?: Record<string, string>;
}

interface ContactInfoEntry {
  type: string;
  value: string;
  note?: string;
  primary?: boolean;
}

interface NodeInfoFormProps {
  initialData?: NodeInfoPayload;
  onSubmit: (payload: NodeInfoPayload) => void;
  isSubmitting: boolean;
  error?: string;
}

// --- Known contact types (derived from NodeInfoContent.tsx getContactLink) ---

interface KnownContactType {
  type: string;
  label: string;
  placeholder: string;
  validate: (value: string) => boolean;
}

const KNOWN_CONTACT_TYPES: KnownContactType[] = [
  {
    type: 'nostr',
    label: 'Nostr',
    placeholder: 'npub1... or hex pubkey',
    validate: (v) => /^(npub1|nprofile1)[a-z0-9]+$/.test(v) || /^[0-9a-f]{64}$/i.test(v),
  },
  {
    type: 'email',
    label: 'Email',
    placeholder: 'user@example.com',
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
  {
    type: 'website',
    label: 'Website',
    placeholder: 'https://example.com',
    validate: (v) => /^https?:\/\/.+\..+/.test(v) || /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/.test(v),
  },
  {
    type: 'telegram',
    label: 'Telegram',
    placeholder: '@username',
    validate: (v) => /^@?[a-zA-Z0-9_]{3,}$/.test(v),
  },
  {
    type: 'twitter',
    label: 'Twitter / X',
    placeholder: '@username',
    validate: (v) => /^@?[a-zA-Z0-9_]{1,}$/.test(v),
  },
  {
    type: 'github',
    label: 'GitHub',
    placeholder: 'username',
    validate: (v) => /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(v),
  },
  {
    type: 'signal',
    label: 'Signal',
    placeholder: 'Phone number or username',
    validate: () => true,
  },
  {
    type: 'simplex',
    label: 'SimpleX',
    placeholder: 'SimpleX contact link',
    validate: () => true,
  },
];

function getKnownType(type: string): KnownContactType | undefined {
  return KNOWN_CONTACT_TYPES.find((t) => t.type === type.toLowerCase());
}

// --- Satoshi formatting helpers ---

/** 21 million BTC in satoshis — practical upper bound for channel sizes */
const MAX_SATS = 2_100_000_000_000_000;

/** Format a raw digits string with thousands separators */
function formatSats(raw: string): string {
  if (!raw) return '';
  const num = parseInt(raw, 10);
  if (isNaN(num)) return '';
  return formatNumber(num);
}

/** Extract only digits from a formatted string */
function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Clamp a raw digit string to MAX_SATS */
function clampSats(raw: string): string {
  if (!raw) return '';
  const num = parseInt(raw, 10);
  if (isNaN(num)) return '';
  if (num > MAX_SATS) return String(MAX_SATS);
  return raw;
}

// --- Component ---

export function NodeInfoForm({
  initialData,
  onSubmit,
  isSubmitting,
  error,
}: NodeInfoFormProps) {
  // Form state — channel sizes stored as raw digit strings
  const [about, setAbout] = useState(initialData?.about || '');
  const [minChannelSize, setMinChannelSize] = useState(
    initialData?.min_channel_size_sat != null ? String(initialData.min_channel_size_sat) : ''
  );
  const [maxChannelSize, setMaxChannelSize] = useState(
    initialData?.max_channel_size_sat != null ? String(initialData.max_channel_size_sat) : ''
  );
  const [contacts, setContacts] = useState<ContactInfoEntry[]>(
    initialData?.contact_info || []
  );
  const [customRecords, setCustomRecords] = useState<Array<{ key: string; value: string }>>(
    initialData?.custom_records
      ? Object.entries(initialData.custom_records).map(([key, value]) => ({ key, value }))
      : []
  );

  // Collapsible state — auto-expand if initial data present
  const [contactsOpen, setContactsOpen] = useState((initialData?.contact_info?.length || 0) > 0);
  const [customRecordsOpen, setCustomRecordsOpen] = useState(
    initialData?.custom_records ? Object.keys(initialData.custom_records).length > 0 : false
  );

  // Validation state — cleared reactively when form changes
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const clearValidationError = useCallback(() => {
    setValidationError((prev) => (prev ? undefined : prev));
  }, []);

  // --- Channel size handlers ---

  const handleSatsChange = useCallback(
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = clampSats(stripNonDigits(e.target.value));
      setter(raw);
      clearValidationError();
    },
    [clearValidationError]
  );

  // --- Contact handlers ---

  const addContact = () => {
    setContacts([...contacts, { type: '', value: '', note: '', primary: false }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof ContactInfoEntry, value: string | boolean) => {
    const updated = [...contacts];
    if (field === 'primary' && typeof value === 'boolean') {
      if (value) {
        updated.forEach((c, i) => { c.primary = i === index; });
      } else {
        updated[index].primary = false;
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setContacts(updated);
    clearValidationError();
  };

  const selectContactType = (index: number, type: string) => {
    updateContact(index, 'type', type);
  };

  // --- Custom record handlers ---

  const addCustomRecord = () => {
    setCustomRecords([...customRecords, { key: '', value: '' }]);
  };

  const removeCustomRecord = (index: number) => {
    setCustomRecords(customRecords.filter((_, i) => i !== index));
  };

  const updateCustomRecord = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customRecords];
    updated[index] = { ...updated[index], [field]: value };
    setCustomRecords(updated);
    clearValidationError();
  };

  // --- Derived state ---

  const isEmpty = useMemo(() => {
    return (
      !about.trim() &&
      !minChannelSize &&
      !maxChannelSize &&
      contacts.length === 0 &&
      customRecords.length === 0
    );
  }, [about, minChannelSize, maxChannelSize, contacts, customRecords]);

  // --- Validation ---

  const validate = (): boolean => {
    setValidationError(undefined);

    const minSat = minChannelSize ? parseInt(minChannelSize, 10) : undefined;
    const maxSat = maxChannelSize ? parseInt(maxChannelSize, 10) : undefined;

    if (minSat !== undefined && maxSat !== undefined && maxSat < minSat) {
      setValidationError('Maximum channel size must be greater than or equal to minimum');
      return false;
    }

    for (let i = 0; i < contacts.length; i++) {
      if (!contacts[i].type.trim()) {
        setValidationError(`Contact ${i + 1}: Type is required`);
        return false;
      }
      if (!contacts[i].value.trim()) {
        setValidationError(`Contact ${i + 1}: Value is required`);
        return false;
      }
    }

    for (let i = 0; i < customRecords.length; i++) {
      if (!customRecords[i].key.trim()) {
        setValidationError(`Custom record ${i + 1}: Key is required`);
        return false;
      }
    }

    return true;
  };

  // --- Build payload ---

  const buildPayload = (): NodeInfoPayload => {
    const payload: NodeInfoPayload = {};

    if (about.trim()) {
      payload.about = about.trim();
    }

    const minSat = minChannelSize ? parseInt(minChannelSize, 10) : undefined;
    const maxSat = maxChannelSize ? parseInt(maxChannelSize, 10) : undefined;

    if (minSat !== undefined && !isNaN(minSat)) {
      payload.min_channel_size_sat = minSat;
    }
    if (maxSat !== undefined && !isNaN(maxSat)) {
      payload.max_channel_size_sat = maxSat;
    }

    const validContacts = contacts.filter((c) => c.type.trim() && c.value.trim());
    if (validContacts.length > 0) {
      payload.contact_info = validContacts.map((c) => ({
        type: c.type.trim(),
        value: c.value.trim(),
        note: c.note?.trim() || undefined,
        primary: c.primary || undefined,
      }));
    }

    const validRecords = customRecords.filter((r) => r.key.trim());
    if (validRecords.length > 0) {
      payload.custom_records = {};
      validRecords.forEach((r) => {
        payload.custom_records![r.key.trim()] = r.value;
      });
    }

    return payload;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(buildPayload());
  };

  // --- Contact value validation hint ---

  const getValueWarning = (contact: ContactInfoEntry): string | undefined => {
    if (!contact.type.trim() || !contact.value.trim()) return undefined;
    const known = getKnownType(contact.type);
    if (!known) return undefined;
    if (!known.validate(contact.value.trim())) {
      return `Value doesn't match expected format for ${known.label}`;
    }
    return undefined;
  };

  const getValuePlaceholder = (contact: ContactInfoEntry): string => {
    const known = getKnownType(contact.type);
    return known?.placeholder || 'Contact value';
  };

  return (
    <div className="space-y-4">
      {/* About */}
      <div>
        <span className="text-sm font-medium text-foreground">About</span>
        <Textarea
          value={about}
          onChange={(e) => { setAbout(e.target.value); clearValidationError(); }}
          placeholder="Describe your node..."
          rows={3}
          className="mt-1"
          disabled={isSubmitting}
        />
      </div>

      {/* Channel Sizes */}
      <div className="border-t border-border pt-4">
        <span className="text-sm font-medium text-foreground">Channel Sizes (satoshis)</span>
        <div className="flex flex-col sm:flex-row gap-4 mt-1">
          <div className="flex-1">
            <span className="text-xs text-label">Minimum</span>
            <Input
              type="text"
              inputMode="numeric"
              value={formatSats(minChannelSize)}
              onChange={handleSatsChange(setMinChannelSize)}
              placeholder="0"
              className="text-right font-mono tabular-nums"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex-1">
            <span className="text-xs text-label">Maximum</span>
            <Input
              type="text"
              inputMode="numeric"
              value={formatSats(maxChannelSize)}
              onChange={handleSatsChange(setMaxChannelSize)}
              placeholder="0"
              className="text-right font-mono tabular-nums"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="border-t border-border pt-4">
        <Collapsible open={contactsOpen} onOpenChange={setContactsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-0 text-sm font-medium text-foreground hover:text-foreground"
            >
              Contact Info{contacts.length > 0 ? ` (${contacts.length})` : ''}
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  contactsOpen && 'rotate-90'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3">
            {contacts.map((contact, index) => {
              const valueWarning = getValueWarning(contact);
              return (
                <div key={index} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-label">Contact {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContact(index)}
                      disabled={isSubmitting}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Type input with suggestion badges */}
                  <div>
                    <Input
                      value={contact.type}
                      onChange={(e) => updateContact(index, 'type', e.target.value)}
                      placeholder="Type"
                      disabled={isSubmitting}
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {KNOWN_CONTACT_TYPES.map((kt) => (
                        <Badge
                          key={kt.type}
                          variant={contact.type.toLowerCase() === kt.type ? 'default' : 'secondary'}
                          className={cn(
                            'text-[10px] cursor-pointer select-none',
                            contact.type.toLowerCase() === kt.type
                              ? ''
                              : 'opacity-60 hover:opacity-100'
                          )}
                          onClick={() => !isSubmitting && selectContactType(index, kt.type)}
                        >
                          {kt.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Value input with format hint */}
                  <div>
                    <Input
                      value={contact.value}
                      onChange={(e) => updateContact(index, 'value', e.target.value)}
                      placeholder={getValuePlaceholder(contact)}
                      disabled={isSubmitting}
                    />
                    {valueWarning && (
                      <span className="text-xs text-amber-500 mt-0.5 block">{valueWarning}</span>
                    )}
                  </div>

                  <Input
                    value={contact.note || ''}
                    onChange={(e) => updateContact(index, 'note', e.target.value)}
                    placeholder="Note (optional)"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={contact.primary || false}
                      onCheckedChange={(checked) =>
                        updateContact(index, 'primary', checked === true)
                      }
                      disabled={isSubmitting}
                    />
                    <span className="text-xs text-muted-foreground">Primary contact</span>
                  </div>
                </div>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={addContact}
              disabled={isSubmitting}
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add Contact
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Custom Records */}
      <div className="border-t border-border pt-4">
        <Collapsible open={customRecordsOpen} onOpenChange={setCustomRecordsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-0 text-sm font-medium text-foreground hover:text-foreground"
            >
              Custom Records{customRecords.length > 0 ? ` (${customRecords.length})` : ''}
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  customRecordsOpen && 'rotate-90'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3">
            {customRecords.map((record, index) => (
              <div key={index} className="p-3 border border-border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-label">Record {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomRecord(index)}
                    disabled={isSubmitting}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Input
                  value={record.key}
                  onChange={(e) => updateCustomRecord(index, 'key', e.target.value)}
                  placeholder="Key"
                  disabled={isSubmitting}
                />
                <Textarea
                  value={record.value}
                  onChange={(e) => updateCustomRecord(index, 'value', e.target.value)}
                  placeholder="Value (can be empty)"
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addCustomRecord}
              disabled={isSubmitting}
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add Custom Record
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Submit Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="border-t border-border pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isEmpty || isSubmitting || !!validationError}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish Node Info'
          )}
        </Button>
      </div>
    </div>
  );
}
