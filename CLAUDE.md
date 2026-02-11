# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

```bash
npm run dev       # Start development server with hot reload
npm run build     # Build for production (includes type check, lint, test, build)
npm run test      # Run all validation (TypeScript, ESLint, Vitest, build)
```

## Project Overview

**nodestr** is a specialized Nostr client for **Lightning node operators** implementing the **CLIP (Common Lightning-node Information Payload) protocol**.

CLIP uses **Nostr event kind 38171** (addressable, replaceable) to publish verifiable Lightning node information. The protocol cryptographically links Lightning node identities to Nostr identities through dual signatures.

### Technology Stack

- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS 3 + shadcn/ui components
- **Nostrify** (`@nostrify/nostrify`, `@nostrify/react`) - Primary Nostr protocol library
- **nostr-tools** - NIP-19 encoding/decoding, utilities
- TanStack Query (data fetching & caching)
- React Router (client-side routing)
- Vitest + Testing Library (testing)

## CLIP Protocol Essentials

### Event Structure

**Kind**: `38171` (addressable, replaceable event)

**Tags**:
- `d` (identifier):
  - Node Announcement: `<lightning_pubkey>`
  - Node Info: `<kind>:<lightning_pubkey>:<network>`
- `k` (CLIP message kind):
  - `0` = Node Announcement (trust anchor, requires Lightning signature)
  - `1` = Node Info (metadata, no Lightning signature)
- `sig` (Lightning signature):
  - Present only on Node Announcements
  - Format: zbase32-encoded signature from Lightning node's identity key
  - Signs the Nostr event ID (SHA256 hash of event without `sig` tag)

### Message Types

**Node Announcement (k=0)** — Trust anchor linking Lightning node to Nostr pubkey:
- Must have both Lightning signature (`sig` tag) and Nostr signature
- Content: empty string `""` or `"{}"`
- Latest announcement per Lightning node wins (by `created_at`)
- Pubkey rotation invalidates all previous events from old Nostr key

**Node Info (k=1)** — Metadata about Lightning node:
- Only requires Nostr signature (from bound Nostr key)
- Content: JSON with structured fields:
  ```json
  {
    "about": "Node description",
    "max_channel_size_sat": 16777215,
    "min_channel_size_sat": 40000,
    "contact_info": [
      {
        "type": "nostr",
        "value": "npub1...",
        "note": "Primary contact",
        "primary": true
      }
    ],
    "custom_records": {
      "acceptance_policy": "...",
      "closing_policy": "..."
    }
  }
  ```
- Network-specific (mainnet, testnet, testnet4, signet)
- Validation exactly matches Go reference implementation

### Trust Model (Critical)

The **ClipStore** (`src/lib/clipStore.ts`) enforces these rules:

1. **Latest Announcement Wins**: For each Lightning node pubkey, only the most recent announcement (by `created_at`) is accepted
2. **Pubkey Rotation**: If a new announcement uses a different Nostr pubkey, all previous events are **purged** (security measure for compromised keys)
3. **Node Info Gating**: Node Info events are only accepted if:
   - A valid Node Announcement exists for that Lightning node
   - The Nostr pubkey matches the latest announcement
   - The event is newer than any existing Node Info for that d-tag

### Allowed Networks

Network validation is **case-sensitive** and must match Go reference exactly:

```typescript
const VALID_NETWORKS = ['mainnet', 'testnet', 'testnet4', 'signet', 'simnet', 'regtest'];
```

Node Info events with any other network value MUST be rejected.

### Verification Rules

From `src/lib/clip.ts`, all CLIP events must pass:

1. **Basic Nostr validation**:
   - Event ID matches computed hash
   - Valid Nostr signature
   - Created_at not too far in future (grace period: 10 minutes)
   
2. **CLIP-specific validation**:
   - Has required `d` and `k` tags
   - Content size ≤ 1MB
   - Network is valid (for Node Info)
   - Correct d-tag format for message kind

3. **Lightning signature validation**:
   - zbase32 decoding + secp256k1 signature recovery + double SHA-256
   - Recovered pubkey must match Lightning pubkey in `d` tag

### Fetch Windows

**Critical for trust semantics**:

- **Node Announcements (k=0)**: Fetched with **1 year window** (or longer)
  - Rationale: Valid Node Info must not be rejected because its announcement is older than the UI feed window
  - Implementation: `ANNOUNCEMENT_WINDOW_SECONDS = 365 * 24 * 60 * 60`

- **Node Info (k=1)**: Fetched with **feed window** (currently 1 year for development)
  - Can be time-windowed at UI level
  - Implementation: `FEED_WINDOW_SECONDS = 365 * 24 * 60 * 60`

## Architecture Overview

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (48+)
│   ├── auth/                  # LoginArea, LoginDialog (NIP-07)
│   ├── relay/                 # Relay management UI components
│   ├── AppProvider.tsx        # Global config (theme, relay settings)
│   ├── NostrProvider.tsx      # Nostr relay pool initialization
│   ├── NostrSync.tsx          # NIP-65 relay sync → AppContext
│   ├── RelayHealthProvider.tsx # Relay health monitoring (read-only enrichment)
│   ├── NoteContent.tsx        # Rich text rendering
├── pages/
│   ├── HomePage.tsx           # Home feed (CLIP events)
│   ├── SearchPage.tsx         # CLIP-aware search
│   ├── DMsPage.tsx            # Direct messaging
│   ├── SettingsPage.tsx       # Relay management, app settings
│   ├── OperatorProfile.tsx    # Operator profile page
│   ├── ProfilePage.tsx        # NIP-19 routing wrapper
│   ├── NodePage.tsx           # Lightning node page
│   ├── LnPubPage.tsx         # Lightning pubkey → operator redirect
│   ├── NIP19Page.tsx          # NIP-19 identifier routing
│   └── NotFound.tsx           # 404 page
├── hooks/
│   ├── useClipFeed.ts         # Feed pipeline (fetch + verify + store)
│   ├── useOperatorProfile.ts  # Derive operator data from CLIP events
│   ├── useNostr.ts            # Core Nostr query/publish (from @nostrify/react)
│   ├── useAuthor.ts           # Fetch Kind 0 metadata
│   ├── useCurrentUser.ts      # Get logged-in user
│   ├── useNostrPublish.ts     # Publish with auto "client" tag
│   ├── useRelayHealth.ts      # Relay health context consumer
│   └── [other hooks...]
├── contexts/
│   ├── AppContext.ts          # App config (theme, relays)
│   ├── RelayHealthContext.ts  # Relay health monitoring context
│   ├── SearchContext.tsx       # Search state management
│   ├── UnreadContext.tsx       # Unread counts
│   ├── NWCContext.tsx         # Nostr Wallet Connect
│   └── DMContext.ts           # Direct messaging
├── lib/
│   ├── clip.ts                # CLIP event validation & parsing
│   ├── clipStore.ts           # ClipStore with trust semantics
│   ├── relayHealthStore.ts    # IndexedDB relay health persistence
│   ├── relayProbe.ts          # WebSocket relay probing
│   ├── relayScoring.ts        # Relay scoring (40/40/20 model)
│   ├── nip11.ts               # NIP-11 relay metadata fetching
│   ├── nip66.ts               # NIP-66 relay discovery parsing
│   ├── genUserName.ts         # Generate display names from pubkeys
│   └── utils.ts               # General utilities
├── test/
│   ├── TestApp.tsx            # Test provider wrapper
│   └── setup.ts               # Vitest environment
├── App.tsx                    # Main app (CRITICAL: provider stack)
├── AppRouter.tsx              # React Router config
└── main.tsx                   # Entry point

eslint-rules/                  # Custom ESLint rules
├── no-inline-script.js        # XSS prevention
├── no-placeholder-comments.js # Catches placeholder TODOs
└── require-webmanifest.js     # Ensures manifest exists
```

### Provider Stack (App.tsx)

**CRITICAL**: The provider order must not be changed:

1. `UnheadProvider` - SEO metadata management
2. `AppProvider` - App config (theme, relay settings)
3. `QueryClientProvider` - TanStack Query for data fetching
4. `SearchProvider` - Search state management
5. `NostrLoginProvider` - NIP-07 login/signer
6. `NostrProvider` - Nostr relay connections
7. `RelayHealthProvider` - Relay health monitoring (read-only enrichment layer)
8. `NostrSync` - NIP-65 relay sync on login
9. `NWCProvider` - Nostr Wallet Connect
10. `DMProvider` - Direct messaging
11. `UnreadProvider` - Unread counts
12. `TooltipProvider` - shadcn/ui tooltips

**Always read App.tsx before making changes.** Modifying the provider stack can break the entire application.

## Key Implementation Files

### 1. src/lib/clip.ts
CLIP event validation and parsing. Implements verification rules that mirror the Go reference:
- Event structure validation
- Network validation
- Lightning signature cryptographic verification
- Identifier parsing (d-tag decoding)

### 2. src/lib/clipStore.ts
In-memory store implementing trust semantics:
- Per-node state tracking (last announcement, events map)
- Announcement replacement logic (latest wins)
- Pubkey rotation handling (purge old events)
- Node Info gating (requires valid announcement)

### 3. src/hooks/useClipFeed.ts
Feed pipeline:
1. Query announcements (1 year window)
2. Query Node Info (feed window)
3. Verify each event with `verifyClipEvent()`
4. Store valid events in `ClipStore`
5. Return sorted events (created_at desc)

Includes timeout handling (10 seconds per query) and detailed console logging for debugging.

### 4. src/hooks/useOperatorProfile.ts
Derives operator profile data:
1. Fetch CLIP events by author pubkey
2. Verify and store in ClipStore
3. Extract operated nodes from announcements
4. Group Node Info by Lightning node and network
5. Build timeline of CLIP events
6. Return OperatorProfile object

### 5. src/pages/OperatorProfile.tsx
Displays operator profiles:
- Nostr identity (name, picture, about from Kind 0)
- List of operated Lightning nodes
- Node Info payloads per network
- Timeline of CLIP events (k=0, k=1)
- Links to mempool.space for each node
- Network badges with distinct colors

## Routing

Routes defined in `AppRouter.tsx`:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Home feed (CLIP events) |
| `/search` | `SearchPage` | CLIP-aware search |
| `/dms` | `DMsPage` | Direct messaging |
| `/settings` | `SettingsPage` | Relay management, app settings |
| `/profile/:nip19Identifier` | `ProfilePage` | Operator profile |
| `/p/:nip19Identifier` | `ProfilePage` | Alternative profile route |
| `/lightning/operator/:lightningPubkey` | `LnPubPage` | Lightning pubkey → operator redirect |
| `/lightning/:network/node/:pubkey` | `NodePage` | Lightning node page |
| `/:nip19` | `NIP19Page` | NIP-19 routing (npub, note, nevent, naddr) |
| `*` | `NotFound` | 404 page |

**NIP-19 Routing**: Use root-level paths (e.g., `/npub1abc...`) not nested paths (e.g., `/profile/npub1abc...`).

## Common Development Patterns

### Query CLIP Events

```typescript
import { useClipFeed } from '@/hooks/useClipFeed';

function Feed() {
  const { data: events, isLoading, isError } = useClipFeed();
  
  if (isLoading) return <FeedSkeleton />;
  if (isError) return <ErrorCard />;
  
  return events.map(stored => (
    <EventCard key={stored.event.id} event={stored} />
  ));
}
```

### Get Operator Profile

```typescript
import { useOperatorProfile } from '@/hooks/useOperatorProfile';
import { useAuthor } from '@/hooks/useAuthor';

function Profile({ pubkey }: { pubkey: string }) {
  const profile = useOperatorProfile(pubkey);
  const author = useAuthor(pubkey); // Kind 0 metadata
  
  return (
    <div>
      <h1>{author.data?.metadata?.name || genUserName(pubkey)}</h1>
      <p>Operates {profile.data?.operatedNodes.length} nodes</p>
    </div>
  );
}
```

### Access Current User

```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser';

function MyComponent() {
  const { user } = useCurrentUser();
  
  if (!user) return <span>Log in to continue</span>;
  
  return <span>Logged in as {user.pubkey}</span>;
}
```

### Verify CLIP Event

```typescript
import { verifyClipEvent, CLIP_ANNOUNCEMENT } from '@/lib/clip';

const now = Math.floor(Date.now() / 1000);
const result = verifyClipEvent(event, now);

if (!result.ok) {
  console.error('Verification failed:', result.error);
  return;
}

if (result.identifier.kind === CLIP_ANNOUNCEMENT) {
  // Valid Node Announcement
  console.log('Lightning pubkey:', result.identifier.pubkey);
}
```

## External API Integration

### mempool.space API

**Base URL**: `https://mempool.space` (configurable)

| Network | Endpoint |
|---------|----------|
| Mainnet | `/api/v1/lightning/search?searchText=<query>` |
| Signet | `/signet/api/v1/lightning/search?searchText=<query>` |
| Testnet3 | `/testnet/api/v1/lightning/search?searchText=<query>` |
| Testnet4 | No API available (full pubkey input only) |

**Two use cases**: (1) Suggestion list — alias/partial search, all `nodes[]` entries are valid candidates; (2) Pubkey existence check — exact match, only for valid hex pubkeys, informational only (does not block publishing).

**Key rules**: `status` field must NOT be used for filtering. Empty `nodes[]` means unknown on mainnet.

**Use Case 1 - Suggestion List** (alias/partial search):
```typescript
const response = await fetch(
  `https://mempool.space/api/v1/lightning/search?searchText=foo`
);
const data = await response.json();
// data.nodes[] contains all matching nodes
// Status field must NOT be used for filtering
```

**Use Case 2 - Pubkey Existence Check** (exact match):
```typescript
// Only execute if input is valid hex Lightning pubkey
const response = await fetch(
  `https://mempool.space/api/v1/lightning/search?searchText=${fullPubkey}`
);
const data = await response.json();
// data.nodes[] should have exactly one entry if node exists
// Empty array means unknown on mainnet (informational only, does not block publishing)
```

### Response Format

```json
{
  "nodes": [
    {
      "public_key": "03cd1e...",
      "alias": "NodeName",
      "capacity": 25777215,
      "channels": 3,
      "status": 0  // Do NOT use for filtering
    }
  ],
  "channels": []
}
```

## Lightning Signature Workflow (Interactive Mode)

**Critical**: No Lightning keys in the browser. Users sign externally.

### Publishing Flow (Node Announcement)

1. User enters Lightning node pubkey
2. **nodestr generates event hash**:
   ```typescript
   // Event ID (hex) without 'sig' tag
   const hash = event.getID();
   ```
3. Display hash in copyable field with instructions:
   ```
   Sign this hash with your Lightning node:
   lncli signmessage <hash>
   ```
4. User signs externally (`lncli signmessage`, CLN, Eclair)
5. User pastes zbase32 signature
6. **nodestr validates format**:
   ```typescript
   // Verify Lightning signature
   // Full crypto verification (zbase32 + secp256k1)
   //   - Decode zbase32
   //   - Recover pubkey from signature
   //   - Verify matches Lightning pubkey in d-tag
   ```
7. Add signature to `sig` tag
8. Request Nostr signing via NIP-07
9. Publish to relays

### Signing Order (Critical)

From Go reference (`CombinedSigner`):

1. Event must be finalized (`d` and `k` tags set)
2. For Node Announcement (k=0):
   - Lightning signature (`sig` tag) added **first**
   - Signs event hash **without** sig tag
3. Nostr signature added **last**
   - Signs final event **including** sig tag

## Relay Management

**Source of Truth**: `AppContext` (localStorage) manages the relay list (url + read + write). `RelayHealthProvider` is a **read-only enrichment layer** that adds health metadata (status, latency, score, NIP-11).

**Default Relays** (from App.tsx, used for migration):
```typescript
[
  { url: 'wss://relay.damus.io', read: true, write: true },
  { url: 'wss://nos.lol', read: true, write: true },
  { url: 'wss://relay.primal.net', read: true, write: true },
]
```

**Architecture**:
```
AppContext (relay list: url + read + write) ← SINGLE SOURCE OF TRUTH
     ↓ reads                    ↓ reads
NostrProvider               RelayHealthProvider
  (routing via ref)           (health data only: status, latency, score, nip11)
     ↓                          ↓ persists to
DMProvider                  IndexedDB (health metadata only)
```

**Key Components**:
- `RelayHealthProvider` — orchestrates probing, NIP-66 discovery, NIP-11 fetch, NIP-65 publishing
- `RelayHealthContext` — exposes health data and actions via `useRelayHealth()` hook
- `relayHealthStore.ts` — IndexedDB persistence (health records per relay)
- `relayProbe.ts` — WebSocket probing with CLIP event counting
- `relayScoring.ts` — Composite scoring (0-100): Reachability 40pts + Latency 40pts + Reliability 20pts
- `nip11.ts` — NIP-11 relay metadata (HTTP GET with `Accept: application/nostr+json`)
- `nip66.ts` — NIP-66 relay discovery (kind 30166 + 10166)

**Sync Flow**:
1. User logs in → `NostrSync` fetches NIP-65 (kind 10002) → writes to AppContext via `updateConfig`
2. RelayHealthProvider watches AppContext relay list, probes all relays on startup and every 5 minutes
3. User-initiated relay changes auto-publish as kind 10002 (30s debounce)

**Scoring Model** (no CLIP weight, no auto-optimization):

| Factor | Weight | Details |
|--------|--------|---------|
| Reachability | 40 pts | connected=40, slow=15, unreachable=0 |
| Latency | 40 pts | <200ms=40, <500ms=30, <1s=20, <2s=10, else=5 |
| Reliability | 20 pts | 0 failures=20, ≤2=10, else=0 |

**Conservative Optimizer**: No auto-add/remove of relays. NIP-66 suggestions displayed for user to confirm. Relay list changes only through user actions or NostrSync.

**Storage**: IndexedDB (`nostr-relay-health-{hostname}`) for health data only. Relay list in localStorage via AppContext.

**Configuration Storage**: localStorage (`nostr:app-config`)

## Design System

Full design system documentation: [`docs/design-system.md`](./docs/design-system.md)

**Key rules** (always apply):
- Use CSS custom properties, never direct slate colors
- Use semantic tokens: `text-foreground`, `text-muted-foreground`, `text-label`, `text-link`
- Typography hierarchy: page title (2xl), section header (lg), card title (base), body (sm), labels (xs)
- Match responsive prefixes when overriding shadcn/ui padding (e.g., `py-12 sm:py-12`)
- Use `formatRelativeTime()` with HTML `title` for timestamps

## Testing

### When to Write Tests

**Only write tests if**:
1. User explicitly requests tests
2. User describes a specific bug and asks for tests to diagnose
3. User reports a problem after attempted fix

**Never write tests because**:
- Tool results show failures (not a user request)
- You think tests would be helpful
- New features are created

### When to Run Tests

**ALWAYS run the test script after ANY code changes.**

```bash
npm run test  # TypeScript → ESLint → Vitest → Build
```

Your task is not complete until tests pass.

### Test Setup

Use `TestApp` wrapper for all component tests:

```tsx
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { MyComponent } from './MyComponent';

it('renders correctly', () => {
  render(
    <TestApp>
      <MyComponent />
    </TestApp>
  );
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});
```

## Validation Requirements

**CRITICAL**: After making ANY code changes, validate your work:

1. **Type Check** (Required): `tsc --noEmit`
2. **Build** (Required): `vite build`
3. **Lint** (Recommended): `eslint`
4. **Tests** (If Available): `vitest run`
5. **Git Commit** (Required): Create commit when finished

**Your task is not finished until code type-checks and builds successfully.**

Run all validation:
```bash
npm run test
```

## Development Constraints

### MUST Follow

- **Do NOT guess protocol details** — Refer to Go reference in `docs/clip-reference.md`
- **Do NOT invent NIPs or CLIP extensions** — Strict Go compatibility required
- **Keep app runnable at all times** — Every change ends with working app

## Go Reference Equivalence

The CLIP implementation must **strictly mirror** the Go reference.

**Reference code**: `docs/clip-reference.md` (event.go, client.go, store.go, payloads.go)

**Key behaviors**:
- Latest announcement wins (by `created_at`)
- Pubkey rotation purges old events
- Node Info requires valid announcement from same Nostr key
- Content size limit: 1MB
- Event grace period: 10 minutes
- Network validation: case-sensitive, exact match

## Common Patterns & Anti-Patterns

### ✅ Good Practices

- Use `useClipFeed()` for feed data
- Use `useOperatorProfile(pubkey)` for profile data
- Use `useAuthor(pubkey)` for Kind 0 metadata
- Use `useCurrentUser()` before publishing
- Verify events with `verifyClipEvent()` before storing
- Store verified events in `ClipStore` to enforce trust semantics
- Use `TestApp` wrapper for all component tests
- Reference Go files for protocol details (`docs/clip-reference.md`)
- **UI Components**: Before creating new components, analyze existing similar components for consistent formatting (typography, spacing, colors)
- **Reference-First Development**: When building pages similar to existing ones (e.g., Node Page similar to OperatorProfile), read and mirror the existing implementation

### React Portal Event Bubbling

React portals (`DialogPortal`, `createPortal`) render DOM nodes outside the parent DOM tree, but React synthetic events still bubble through the **React component tree**. This means a click inside a `<Dialog>` rendered in a portal will bubble to the parent Card's `onClick` handler, even though the dialog is in `document.body` in the DOM.

**Mitigation**: The shared `DialogContent` component in `src/components/ui/dialog.tsx` wraps portal children in a `<div onClick={stopPropagation}>` to prevent this. If you create other portal-based components inside clickable containers, apply the same pattern.

### ❌ Avoid

- Modifying `App.tsx` without reading it first
- Creating new providers without understanding the stack
- Using `any` type (always use proper TypeScript types)
- Guessing CLIP protocol details
- Inventing custom NIPs or extensions
- Skipping Go reference equivalence checks
- **Inventing new typography sizes**: Always use the Typography Hierarchy from Design System section
- **Creating UI without reference analysis**: Never build new pages/components without first analyzing similar existing components for formatting patterns
- **Replacing prototypes without preserving design decisions**: When a design prototype is replaced by a real implementation, always read the prototype code first and carry over all UI/styling decisions (spacing, responsive breakpoints, interaction patterns, component sizes). The design phase has authority over functional specs for visual details.

### External API Data Handling

When consuming external APIs (mempool.space, relay responses, etc.):
- **Always validate data before use**: External APIs may return `null`, `undefined`, or unexpected types
- **Provide sensible defaults**: Use nullish coalescing (`??`) or default parameters
- **Type guards for arrays**: Check `Array.isArray()` before mapping/filtering
- **Graceful degradation**: Display fallback UI rather than crashing

Example:
```typescript
// Good - handles null/undefined
const capacity = node.capacity ?? 0;
const channels = node.channels ?? 0;

// Bad - crashes on null
const capacity = node.capacity.toLocaleString(); // TypeError if null
```

### Clipboard API (Requires Fallback)

`navigator.clipboard.writeText()` only works in **secure contexts** (HTTPS or localhost). Every copy-to-clipboard implementation **must** include a `document.execCommand('copy')` fallback. Reference: `src/components/clip/CopyButton.tsx`.

### Auto-Scroll in ScrollArea (ResizeObserver Pattern)

When implementing "scroll to bottom on new content" inside a Radix ScrollArea, do **not** rely on React `useEffect` with `messages.length` — the effect fires before the DOM is updated. Instead, use a `ResizeObserver` on the scroll viewport's content element:

```typescript
const resizeObserver = new ResizeObserver(() => {
  const wasNearBottom = prevScrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
  if (wasNearBottom && viewport.scrollHeight > prevScrollHeight) {
    viewport.scrollTop = viewport.scrollHeight;
  }
  prevScrollHeight = viewport.scrollHeight;
});
resizeObserver.observe(viewport.firstElementChild);
```

This fires **after** the DOM has been updated, making it reliable for any kind of content change (new messages, images loading, etc.).

### Number Formatting (Locale-Aware)

All numeric values displayed to the user must use the centralized `formatNumber()` utility from `@/lib/utils`. This ensures consistent locale-aware thousands separators across the entire app.

```typescript
import { formatNumber } from '@/lib/utils';

// Good - uses browser locale consistently
formatNumber(16777215)              // "16,777,215" (en) or "16.777.215" (de)
formatNumber(0.5, { maximumFractionDigits: 2 })  // with options

// Bad - inconsistent locale handling
num.toLocaleString()                // implicit browser locale (OK but not standardized)
num.toLocaleString('en-US')         // hardcoded locale (WRONG)
```

**Rules:**
- Use `formatNumber(value)` for all integer displays (sats, channels, capacity)
- Use `formatNumber(value, options)` when `Intl.NumberFormatOptions` are needed (e.g., decimal places)
- Do NOT use `formatNumber` for dates — use `Date.toLocaleString()` directly for dates
- In form inputs: store raw digits internally, use `formatNumber()` for display formatting. The `stripNonDigits()` pattern handles any locale separator on input.

### User Display Name Consistency

When displaying user/operator names:
- **Always use `genUserName(pubkey)`** as fallback when no name is available
- **Never display "Unknown"** - use the fun animal name generator instead
- **Pattern**: `name || genUserName(pubkey)` or `metadata?.name ?? genUserName(pubkey)`

Example:
```typescript
import { genUserName } from '@/lib/genUserName';

// Good - consistent with rest of app
const displayName = author?.metadata?.name || genUserName(pubkey);

// Bad - inconsistent "Unknown" text
const displayName = author?.metadata?.name || 'Unknown';
```

### Lightning Node Alias Fallback

When displaying a Lightning node without a known alias (e.g., not found via mempool.space), follow the **mempool.space convention**: use the **first 20 characters** of the pubkey as the alias. This matches the Lightning Network standard where nodes without custom aliases are displayed with a truncated pubkey.

```typescript
// Good - mempool.space convention (first 20 chars of pubkey)
const alias = pubkeyAlias(pubkey); // "020b7ead41d8cc6d80c6"

// Bad - full 66-char pubkey as alias
const alias = pubkey; // "020b7ead41d8cc6d80c6f152b67037ee8203e7226a44bae460beeca464d75a773d"

// Bad - custom truncation with "..."
const alias = pubkey.slice(0, 8) + '...' + pubkey.slice(-8); // "020b7ead...5d75a773d"
```

CSS `truncate` remains the secondary truncation layer for narrow containers. Never manually insert `...` into alias strings.

### Avatar Fallback Styling

When using `AvatarFallback` with initials:
- **Use `pubkeyToColor(pubkey)`** for background color
- **Use white text**: `className="text-white font-bold text-sm"`
- **Apply style conditionally** when pubkey is available

Example (from `CardHeader.tsx`):
```typescript
import { pubkeyToColor } from '@/lib/utils';

const avatarColor = pubkey ? pubkeyToColor(pubkey) : undefined;

<AvatarFallback
  style={avatarColor ? { backgroundColor: avatarColor } : undefined}
  className="text-white font-bold text-sm"
>
  {initials}
</AvatarFallback>
```

## Git Workflow

```bash
git status              # Check status
git diff                # See changes
git log --oneline       # View history

# After validation passes:
git add <files>
git commit -m "Brief description"
```

Always create descriptive commit messages when work is complete.

## Quick Reference

### Context Routing Map

| Task | Start Here | Reference |
|------|-----------|-----------|
| CLIP Protocol | `src/lib/clip.ts`, `clipStore.ts` | CLAUDE.md "CLIP Protocol Essentials" |
| Operator Profiles | `src/pages/OperatorProfile.tsx` | `useOperatorProfile.ts` |
| Relay Management | `src/components/RelayHealthProvider.tsx` | CLAUDE.md "Relay Management" |
| Node Discovery | `src/pages/SearchPage.tsx` | `useMempoolSearch.ts` |
| Direct Messages | `src/components/DMProvider.tsx` | `/nostr-direct-messages` skill |
| UI / Design | `src/components/ui/` | `docs/design-system.md` |
| Provider Stack | `src/App.tsx` | CLAUDE.md "Provider Stack" |
| Nostr Patterns | — | `docs/nostr-patterns.md` |
| CLIP Go Reference | — | `docs/clip-reference.md` |

### Important Constants
- CLIP event kind: `38171`
- Node Announcement: `k=0` (requires Lightning sig)
- Node Info: `k=1` (Nostr sig only)
- Announcement window: `365 * 24 * 60 * 60` seconds (1 year)
- Feed window: `365 * 24 * 60 * 60` seconds (1 year for dev)
- Max content size: `1MB`
- Event grace period: `600` seconds (10 minutes)

### Default Relays
- `wss://relay.ditto.pub`
- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.primal.net`

### Debug Tools
- Browser console: `[RelayHealth]`, `[NostrProvider]`, `[useClipFeed]` logs
- Network tab: Check WebSocket connections (Status 101 = connected)
- Settings page: Relay health indicators, NIP-11 details, score display

## Additional Resources

- **CHANGELOG.md** — Phase completion history and recent changes
- `docs/clip-reference.md` — CLIP protocol Go reference code (event.go, store.go, client.go, payloads.go)
- `docs/nostr-patterns.md` — Nostr integration patterns, security model, query design
- `docs/design-system.md` — Complete design system and visual standards
