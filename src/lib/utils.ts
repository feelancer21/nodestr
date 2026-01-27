import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncate a string in the middle with ellipsis
 */
export function truncateMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const charsToShow = maxLength - 3; // Account for "..."
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return `${str.slice(0, frontChars)}...${str.slice(-backChars)}`;
}

/**
 * Format npub for display with middle truncation
 */
export function formatNpub(npub: string, maxLength: number = 20): string {
  return truncateMiddle(npub, maxLength);
}

/**
 * Format Lightning pubkey for display (e.g., "03a93b...78dda9")
 */
export function formatLightningPubkey(pubkey: string, maxLength: number = 16): string {
  if (pubkey.length <= maxLength) return pubkey;
  const frontChars = 6;
  const backChars = 6;
  return `${pubkey.slice(0, frontChars)}...${pubkey.slice(-backChars)}`;
}

/**
 * Get mempool.space URL for a Lightning node on a specific network
 * Returns null for unsupported networks (testnet4, simnet, regtest)
 */
export function getMempoolNodeUrl(pubkey: string, network: string): string | null {
  switch (network) {
    case 'mainnet':
      return `https://mempool.space/lightning/node/${pubkey}`;
    case 'testnet':
      return `https://mempool.space/testnet/lightning/node/${pubkey}`;
    case 'signet':
      return `https://mempool.space/signet/lightning/node/${pubkey}`;
    default:
      return null; // testnet4, simnet, regtest not supported
  }
}

/**
 * Generate a deterministic color from a pubkey hash
 */
export function pubkeyToColor(pubkey: string): string {
  // Use first 6 chars of pubkey as hex color base
  const hash = pubkey.slice(0, 6).padEnd(6, '0');
  // Adjust to ensure readable colors (not too dark, not too light)
  const r = parseInt(hash.slice(0, 2), 16);
  const g = parseInt(hash.slice(2, 4), 16);
  const b = parseInt(hash.slice(4, 6), 16);
  // Boost saturation and ensure minimum brightness
  const minBrightness = 100;
  const adjustedR = Math.max(minBrightness, r);
  const adjustedG = Math.max(minBrightness, g);
  const adjustedB = Math.max(minBrightness, b);
  return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
}

/**
 * Format relative time (e.g., "5m ago", "2h ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const createdAt = timestamp * 1000;
  const diffSeconds = Math.max(0, Math.floor((now - createdAt) / 1000));

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

/**
 * Get network badge color classes
 */
export function getNetworkBadgeColor(network: string): string {
  switch (network) {
    case 'mainnet':
      return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
    case 'testnet':
      return 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-200';
    case 'testnet4':
      return 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-200';
    case 'signet':
      return 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200';
    default:
      return 'bg-slate-200 dark:bg-slate-500/10 text-slate-700 dark:text-slate-200';
  }
}
