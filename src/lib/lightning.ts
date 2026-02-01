/**
 * Validates if a string is a valid Lightning node public key.
 * Lightning pubkeys are 66-character hex strings starting with '02' or '03'.
 */
export function isValidLightningPubkey(input: string): boolean {
  if (input.length !== 66) return false;
  if (!/^[0-9a-fA-F]+$/.test(input)) return false;
  const prefix = input.slice(0, 2).toLowerCase();
  return prefix === '02' || prefix === '03';
}
