# Issue 005: Node Page - Support Unknown Nodes with Valid Pubkey

**Status:** Open
**Created:** 2026-02-01
**Reported by:** Product Owner

## Finding Description (Product Owner Perspective)

Die NodePage ist für Nodes mit validen Pubkey nicht erreichbar (hex der Länge 66 und 02, 03 am Anfang). Das sollte funktionieren mit '—' für Capacity und Channel.

## Technical Analysis (Technical Lead Perspective)

Currently, the NodePage (`src/pages/NodePage.tsx`) relies on `useNodeDetails` to fetch node data from the mempool.space API. When a node is not found in the mempool API response, `node` is `undefined`, and the page displays "Node Not Found".

However, the page should still be accessible for valid Lightning pubkeys (66 hex characters starting with `02` or `03`) even if the node is not indexed by mempool.space. This is important because:

1. Some nodes may exist on testnet/signet but not be indexed
2. Nodes may be offline or not yet indexed
3. Users should still be able to view CLIP announcements/info for these nodes

The validation logic for Lightning pubkeys already exists in `SearchPage.tsx`:
```typescript
function isValidLightningPubkey(input: string): boolean {
  if (input.length !== 66) return false;
  if (!/^[0-9a-fA-F]+$/.test(input)) return false;
  const prefix = input.slice(0, 2).toLowerCase();
  return prefix === '02' || prefix === '03';
}
```

## Impact Assessment

- **Severity:** Medium
- **Affected areas:** NodePage accessibility, user experience for testnet/signet users
- **User impact:** Users cannot view CLIP data for nodes not indexed by mempool.space

## Recommended Resolution Approach

1. Extract `isValidLightningPubkey` to a shared utility (e.g., `src/lib/lightning.ts`)
2. Modify `NodePage.tsx` to:
   - Check if pubkey is a valid Lightning pubkey format
   - If valid but mempool returns no data, display a "synthetic" node with:
     - `alias`: "Unknown Node"
     - `capacity`: displayed as "—"
     - `channels`: displayed as "—"
   - Still show CLIP operator/nodeInfo data if available
3. Update `NodeBanner.tsx` to gracefully handle null/undefined capacity and channels (already partially done with `formatCapacitySats`)

## Context & Constraints

- The mempool.space API does not cover all networks (testnet4 has no API)
- CLIP announcements can exist for nodes not indexed by mempool
- The `useNodeDetails` hook already handles CLIP lookups independently of mempool data
