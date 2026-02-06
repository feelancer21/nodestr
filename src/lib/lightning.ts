import { secp256k1 } from '@noble/curves/secp256k1.js';

/**
 * Validates if a string is a valid Lightning node public key.
 * Lightning pubkeys are 66-character hex strings representing valid points on the secp256k1 curve.
 * Uses cryptographic validation via @noble/curves to ensure the public key is mathematically valid.
 */
export function isValidLightningPubkey(input: string): boolean {
  if (input.length !== 66) return false;
  if (!/^[0-9a-fA-F]+$/.test(input)) return false;

  try {
    // Validate by attempting to parse the hex string as a point on the secp256k1 curve
    // fromHex will throw if the point is invalid or not on the curve
    secp256k1.Point.fromHex(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a fallback alias for a Lightning node, matching the mempool.space convention.
 * Uses the first 20 characters of the pubkey.
 */
export function pubkeyAlias(pubkey: string): string {
  return pubkey.slice(0, 20);
}
