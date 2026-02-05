import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * zbase32 alphabet as defined by the protocol.
 * Maps each character to its 5-bit value.
 */
const ZBASE32_ALPHABET = 'ybndrfg8ejkmcpqxot1uwisza345h769';

/**
 * Reverse lookup table: character -> 5-bit value.
 */
const ZBASE32_DECODE_MAP: Record<string, number> = {};
for (let i = 0; i < ZBASE32_ALPHABET.length; i++) {
  ZBASE32_DECODE_MAP[ZBASE32_ALPHABET[i]] = i;
}

/**
 * Lightning Signed Message prefix, matching the Go reference:
 *   var signedMsgPrefix = []byte("Lightning Signed Message:")
 */
const SIGNED_MSG_PREFIX = 'Lightning Signed Message:';

/**
 * Decodes a zbase32-encoded string into bytes.
 *
 * zbase32 uses a 5-bit-per-character encoding:
 * - Each character maps to a 5-bit value via the ZBASE32_ALPHABET
 * - Characters are processed left to right, accumulating bits
 * - Bits are packed into bytes (8 bits each)
 * - Any leftover bits at the end are discarded
 *
 * @param encoded - The zbase32-encoded string
 * @returns The decoded byte array
 * @throws Error if any character is not in the zbase32 alphabet
 */
export function decodeZbase32(encoded: string): Uint8Array {
  if (encoded.length === 0) {
    return new Uint8Array(0);
  }

  const lower = encoded.toLowerCase();

  // Total bits available
  const totalBits = lower.length * 5;
  // Number of complete bytes we can extract
  const numBytes = Math.floor(totalBits / 8);
  const result = new Uint8Array(numBytes);

  let buffer = 0;
  let bitsInBuffer = 0;
  let byteIndex = 0;

  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    const value = ZBASE32_DECODE_MAP[char];

    if (value === undefined) {
      throw new Error(`Invalid zbase32 character: '${char}'`);
    }

    // Add 5 bits to the buffer
    buffer = (buffer << 5) | value;
    bitsInBuffer += 5;

    // Extract complete bytes
    while (bitsInBuffer >= 8 && byteIndex < numBytes) {
      bitsInBuffer -= 8;
      result[byteIndex++] = (buffer >> bitsInBuffer) & 0xff;
    }
  }

  return result;
}

/**
 * Verifies a Lightning signature against a Nostr event hash and expected Lightning pubkey.
 *
 * Implements the Go reference algorithm from event.go Verify():
 *
 * 1. Decode the zbase32 signature -> 65 bytes
 * 2. Extract recovery flag from first byte (btcd RecoverCompact format):
 *    - recovery_id = (V - 27) & 3
 *    - The remaining 64 bytes are r (32 bytes) + s (32 bytes)
 * 3. Build message bytes: "Lightning Signed Message:" + eventHash (both as ASCII bytes)
 *    - eventHash is the hex event ID string, treated as ASCII bytes (NOT decoded hex)
 * 4. Double SHA256 the message
 * 5. Recover the public key using secp256k1 compact recovery
 * 6. Compare the recovered compressed pubkey (hex) with expectedLightningPubkey
 *
 * @param eventHash - The hex-encoded event hash (SHA256 of serialized event without sig tag)
 * @param zbase32Signature - The zbase32-encoded Lightning signature
 * @param expectedLightningPubkey - The expected Lightning node public key (hex, compressed)
 * @returns Object with valid boolean and optional error message
 */
export function verifyLightningSignature(
  eventHash: string,
  zbase32Signature: string,
  expectedLightningPubkey: string,
): { valid: boolean; error?: string } {
  try {
    // Step 1: Decode zbase32 signature
    let sigBytes: Uint8Array;
    try {
      sigBytes = decodeZbase32(zbase32Signature);
    } catch (e) {
      return { valid: false, error: `Failed to decode zbase32 signature: ${(e as Error).message}` };
    }

    if (sigBytes.length !== 65) {
      return {
        valid: false,
        error: `Signature must be 65 bytes after decoding, got ${sigBytes.length}`,
      };
    }

    // Step 2: Extract recovery flag from first byte (btcd RecoverCompact format)
    // V = first byte, recovery_id = (V - 27) & 3, compressed = (V - 27) >= 4
    const v = sigBytes[0];
    const recoveryId = (v - 27) & 3;

    if (recoveryId < 0 || recoveryId > 3) {
      return { valid: false, error: `Invalid recovery flag byte: ${v}` };
    }

    // Remaining 64 bytes are r (32) + s (32)
    const rsBytes = sigBytes.slice(1, 65);

    // Step 3: Build message
    // From Go: msg = e.Hash() = []byte(e.copyWithoutSig().GetID())
    // This is the ASCII bytes of the hex event ID string
    // Then: signedMsgPrefix + msg
    const encoder = new TextEncoder();
    const prefixBytes = encoder.encode(SIGNED_MSG_PREFIX);
    const hashBytes = encoder.encode(eventHash);

    const messageBytes = new Uint8Array(prefixBytes.length + hashBytes.length);
    messageBytes.set(prefixBytes, 0);
    messageBytes.set(hashBytes, prefixBytes.length);

    // Step 4: Double SHA256
    const doubleHash = sha256(sha256(messageBytes));

    // Step 5: Recover public key using secp256k1
    const sig = secp256k1.Signature.fromBytes(rsBytes, 'compact').addRecoveryBit(recoveryId);
    const recoveredPoint = sig.recoverPublicKey(doubleHash);
    const recoveredPubkeyHex = recoveredPoint.toHex(true); // compressed format

    // Step 6: Compare with expected pubkey
    if (recoveredPubkeyHex !== expectedLightningPubkey.toLowerCase()) {
      return {
        valid: false,
        error: `Recovered public key (${recoveredPubkeyHex}) does not match expected Lightning pubkey (${expectedLightningPubkey})`,
      };
    }

    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: `Signature verification error: ${(e as Error).message}`,
    };
  }
}
