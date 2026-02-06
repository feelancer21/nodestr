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

### Current Development Phase

The project follows an 11-phase development plan (see PROJECT_PLAN.md). 

**Important**: Lightning signature cryptographic verification is **deferred until Phase 10**. Currently, Lightning signatures are format-checked but **assumed valid** to avoid crypto dependencies during early development.

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

3. **Lightning signature validation** (Phase 10):
   - Currently format-checked only
   - Full cryptographic verification deferred until Phase 10
   - Will use: zbase32 decoding + secp256k1 signature recovery + double SHA-256

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
│   ├── AppProvider.tsx        # Global config (theme, relay settings)
│   ├── NostrProvider.tsx      # Nostr relay pool initialization
│   ├── NostrSync.tsx          # NIP-65 relay sync on login
│   ├── NoteContent.tsx        # Rich text rendering
│   └── RelayListManager.tsx   # NIP-65 relay management UI
├── pages/
│   ├── Index.tsx              # Home feed (CLIP events)
│   ├── OperatorProfile.tsx    # Operator profile page (Phase 3)
│   ├── ProfilePage.tsx        # NIP-19 routing wrapper
│   ├── RelayTest.tsx          # Relay diagnostics (/debug/relays)
│   ├── NIP19Page.tsx          # NIP-19 identifier routing
│   └── NotFound.tsx           # 404 page
├── hooks/
│   ├── useClipFeed.ts         # Feed pipeline (fetch + verify + store)
│   ├── useOperatorProfile.ts  # Derive operator data from CLIP events
│   ├── useNostr.ts            # Core Nostr query/publish (from @nostrify/react)
│   ├── useAuthor.ts           # Fetch Kind 0 metadata
│   ├── useCurrentUser.ts      # Get logged-in user
│   ├── useNostrPublish.ts     # Publish with auto "client" tag
│   └── [other hooks...]
├── contexts/
│   ├── AppContext.ts          # App config (theme, relays)
│   ├── NWCContext.tsx         # Nostr Wallet Connect
│   └── DMContext.ts           # Direct messaging
├── lib/
│   ├── clip.ts                # CLIP event validation & parsing
│   ├── clipStore.ts           # ClipStore with trust semantics
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
4. `NostrLoginProvider` - NIP-07 login/signer
5. `NostrProvider` - Nostr relay connections
6. `NWCProvider` - Nostr Wallet Connect
7. `TooltipProvider` - shadcn/ui tooltips

**Always read App.tsx before making changes.** Modifying the provider stack can break the entire application.

## Key Implementation Files

### 1. src/lib/clip.ts
CLIP event validation and parsing. Implements verification rules that mirror the Go reference:
- Event structure validation
- Network validation
- Lightning signature format checks (crypto deferred to Phase 10)
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
Displays operator profiles (Phase 3):
- Nostr identity (name, picture, about from Kind 0)
- List of operated Lightning nodes
- Node Info payloads per network
- Timeline of CLIP events (k=0, k=1)
- Links to mempool.space for each node
- Network badges with distinct colors

## Routing

Routes defined in `AppRouter.tsx`:

- `/` → Home feed (CLIP events)
- `/profile/:nip19` → Operator profile (Phase 3)
- `/p/:nip19` → Alternative profile route
- `/messages` → Direct messaging
- `/debug/relays` → Relay diagnostics
- `/:nip19` → NIP-19 routing (npub, note, nevent, naddr)
- `*` → 404 NotFound

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

**Purpose**: Discover Lightning nodes and verify existence on mainnet.

**Base URL**: `https://mempool.space` (configurable)

**Endpoints**:
- Mainnet: `/api/v1/lightning/search?searchText=<query>`
- Signet: `/signet/api/v1/lightning/search?searchText=<query>`
- Testnet3: `/testnet/api/v1/lightning/search?searchText=<query>`
- Testnet4: No API available (full pubkey input only)

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
   // Phase 3: Format check only
   // Phase 10: Full crypto verification
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

## Relay Management (NIP-65)

**Default Relays** (from App.tsx):
```typescript
[
  { url: 'wss://relay.damus.io', read: true, write: true },
  { url: 'wss://nos.lol', read: true, write: true },
]
```

**Automatic Sync**:
1. User logs in → `NostrSync` fetches user's NIP-65 event (kind 10002)
2. Local relay list merges with published list
3. Changes to relay config auto-publish as kind 10002
4. `RelayListManager` component provides UI

**Configuration Storage**: localStorage (`nostr:app-config`)

## Relay Diagnostics

**Route**: `/debug/relays`

**Purpose**: Test relay connectivity and diagnose issues

**Features**:
- Per-relay connection testing (5-second timeout)
- Shows connection status, response times, event counts
- Useful for debugging relay issues

**Access from browser**: `http://localhost:5173/debug/relays`

See `RELAY_DEBUG.md` for comprehensive debugging guide.

## Design System

### Core Principles
1. Use CSS custom properties (variables) instead of direct Tailwind colors
2. Never use direct slate colors (`text-slate-*`, `bg-slate-*`) - use semantic tokens
3. Maintain consistent typography hierarchy across all components
4. Accent colors add subtle visual interest without overwhelming

### CSS Custom Properties

**Text Colors:**
- `text-foreground` - Primary text (headings, body)
- `text-muted-foreground` - Secondary/meta text
- `text-label` - Accent color for labels and small metadata (emerald tone)
- `text-link` - Hyperlinks (orange tone)

**Background Colors:**
- `bg-background` - Page background
- `bg-card` - Card backgrounds
- `bg-muted` - Subtle emphasis areas

**Border Colors:**
- `border-border` - Standard borders

### Typography Hierarchy

| Element | Classes | Usage |
|---------|---------|-------|
| Page title | `text-2xl sm:text-3xl font-semibold text-foreground` | Main page headings |
| Section header | `text-lg font-semibold text-foreground` | Card titles, section headings |
| Card title | `text-base font-semibold text-foreground` | Secondary card headings |
| Body text | `text-sm text-foreground` | Main content, descriptions |
| Labels/Meta | `text-xs text-label` | Field labels, metadata, timestamps |
| Muted text | `text-xs text-muted-foreground` | Hints, secondary info |

### Link Styling
All clickable links must use:
```tsx
className="text-link hover:underline"
```

### Component Patterns

**Cards:**
```tsx
<Card className="border-border bg-card">
```

**Section Separation in Cards:**
Use `border-t border-border pt-4` between sections.

**Labels with Accent:**
```tsx
<span className="text-xs text-label">Label Text</span>
```

**Timestamps with Tooltips:**
For relative timestamps (e.g., "24d ago") that need a full date tooltip, use the HTML `title` attribute (not the `<Tooltip>` component):
```tsx
// Correct - simple title attribute
<span
  className="text-xs text-muted-foreground"
  title={new Date(timestamp * 1000).toLocaleString()}
>
  {formatRelativeTime(timestamp)}
</span>

// Incorrect - don't use Tooltip component for simple timestamp tooltips
<Tooltip>
  <TooltipTrigger>...</TooltipTrigger>
  <TooltipContent>...</TooltipContent>
</Tooltip>
```

Use `formatRelativeTime()` from `@/lib/utils` for consistent relative time formatting ("24d ago", "3h ago", etc.).

### Anti-Patterns (Do NOT Use)
- `text-slate-500`, `text-slate-600`, etc.
- `bg-slate-50`, `bg-slate-100`, etc.
- `dark:text-slate-*` variants
- `text-sm uppercase tracking-[0.2em]` for headers
- Direct color values that bypass CSS variables

### Theme System

- Light/dark mode with CSS custom properties
- Control via `useTheme` hook
- Colors defined in `src/index.css`
- Automatic dark mode with `.dark` class

### shadcn/ui Components

48+ accessible components available:
- Buttons, Cards, Dialogs, Forms, Tables, Badges, Skeletons, etc.
- Built on Radix UI primitives
- Styled with Tailwind CSS
- Use `cn()` utility for class merging

### Network Badge Colors

```typescript
function getNetworkBadgeColor(network: string) {
  switch (network) {
    case 'mainnet':  return 'bg-emerald-500/10 text-emerald-200';
    case 'testnet':  return 'bg-blue-500/10 text-blue-200';
    case 'testnet4': return 'bg-indigo-500/10 text-indigo-200';
    case 'signet':   return 'bg-amber-500/10 text-amber-200';
    default:         return 'bg-slate-500/10 text-slate-200';
  }
}
```

### Loading States

**Use skeleton loaders** for structured content (feeds, profiles, forms):
```tsx
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-48" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
  </CardContent>
</Card>
```

**Use spinners** only for buttons or short operations.

### Empty States

```tsx
<Card className="border-dashed">
  <CardContent className="py-12 text-center">
    <p className="text-muted-foreground">
      No results found. Check relay connections or wait for content to load.
    </p>
  </CardContent>
</Card>
```

### Data Table Design Reference

**Preferred Implementation**: [OpenStatus Data Table](https://data-table.openstatus.dev/light)

**Why it fits**:
- Built on TanStack Table + shadcn/ui (already in stack)
- Matches existing design system and theming
- Faceted filters, sorting, command palette integration
- URL-based state persistence with `nuqs` (optional)

**Key Features**:
- Multi-column filtering (status, network, date range, text search)
- Command palette integration (`⌘K` - using `cmdk` package)
- Responsive design with light/dark mode
- Advanced query syntax (union filters, range filters, phrase search)

**Usage**:
- Future: CLIP event management, admin views
- Reference for complex data table implementations

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

- **Do NOT guess protocol details** - Refer to Go reference files in PROJECT_PLAN.md
- **Do NOT invent NIPs or CLIP extensions** - Strict Go compatibility required
- **Do NOT code ahead of current phase** - Phase 3 is in progress
- **Keep app runnable at all times** - Every phase ends with working app
- **Lightning signatures assumed valid** - Full crypto verification in Phase 10

### Phased Development

The project follows 11 phases (see PROJECT_PLAN.md):

- **Phase 0**: Understanding & Architecture ✅
- **Phase 1**: Nostr Login & Relay Settings ✅
- **Phase 2**: Event Foundations & Feed ✅
- **Phase 3**: Nostr Profiles (Operator-Centric) ⬅️ **CURRENT PHASE**
- **Phase 4**: Mempool API & Node Discovery
- **Phase 5**: CLIP-Aware Search
- **Phase 6**: Publishing: Node Selection
- **Phase 7**: Publishing: Node Announcement
- **Phase 8**: Publishing: Node Info
- **Phase 9**: DMs, Settings, Polishing
- **Phase 10**: Lightning Signature Verification (crypto)
- **Phase 11**: README & Documentation

**STOP checkpoints between phases** - Do not proceed to next phase without explicit approval.

## Go Reference Equivalence

The CLIP implementation must **strictly mirror** the Go reference:

**Files to reference** (attached in PROJECT_PLAN.md):
- `event.go` - Event structure, validation, signing
- `client.go` - Fetch logic, store sync
- `store.go` - Trust semantics, announcement handling
- `payloads.go` - Node Info validation

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
- Reference Go files for protocol details
- Check Phase 3 scope before adding features
- **UI Components**: Before creating new components, analyze existing similar components for consistent formatting (typography, spacing, colors)
- **Reference-First Development**: When building pages similar to existing ones (e.g., Node Page similar to OperatorProfile), read and mirror the existing implementation

### React Portal Event Bubbling

React portals (`DialogPortal`, `createPortal`) render DOM nodes outside the parent DOM tree, but React synthetic events still bubble through the **React component tree**. This means a click inside a `<Dialog>` rendered in a portal will bubble to the parent Card's `onClick` handler, even though the dialog is in `document.body` in the DOM.

**Mitigation**: The shared `DialogContent` component in `src/components/ui/dialog.tsx` wraps portal children in a `<div onClick={stopPropagation}>` to prevent this. If you create other portal-based components inside clickable containers, apply the same pattern.

### ❌ Avoid

- Modifying `App.tsx` without reading it first
- Creating new providers without understanding the stack
- Using `any` type (always use proper TypeScript types)
- Implementing Lightning crypto before Phase 10
- Guessing CLIP protocol details
- Inventing custom NIPs or extensions
- Skipping Go reference equivalence checks
- Adding features outside current phase scope
- **Inventing new typography sizes**: Always use the Typography Hierarchy from Design System section
- **Creating UI without reference analysis**: Never build new pages/components without first analyzing similar existing components for formatting patterns

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

## Phase 3 Scope (Current Work)

### Completed
- Profile page routing (`/profile/:nip19`, `/p/:nip19`)
- NIP-19 identifier support (npub, nprofile)
- `useOperatorProfile()` hook for deriving operator data
- `OperatorProfile.tsx` page component
- Navigation from feed cards to profiles
- Display of:
  - Nostr identity (Kind 0: name, picture, about)
  - Operated Lightning nodes (from announcements)
  - Node Info payloads (grouped by node and network)
  - Operator timeline (CLIP events)

### In Progress / Pending
- Profile-level empty/loading/error states refinement
- Profile interaction patterns (DM entry for verified operators)
- Back button navigation polish
- Feed card clickability improvements

### Out of Scope (Future Phases)
- Search functionality (Phase 4-5)
- Publishing flows (Phase 6-8)
- DMs (Phase 9)
- Lightning crypto verification (Phase 10)

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

### File Locations
- CLIP validation: `src/lib/clip.ts`
- ClipStore: `src/lib/clipStore.ts`
- Feed pipeline: `src/hooks/useClipFeed.ts`
- Operator profiles: `src/hooks/useOperatorProfile.ts`, `src/pages/OperatorProfile.tsx`
- Provider stack: `src/App.tsx` (read before modifying)
- Router config: `src/AppRouter.tsx`

### Important Constants
- CLIP event kind: `38171`
- Node Announcement: `k=0` (requires Lightning sig)
- Node Info: `k=1` (Nostr sig only)
- Announcement window: `365 * 24 * 60 * 60` seconds (1 year)
- Feed window: `365 * 24 * 60 * 60` seconds (1 year for dev)
- Max content size: `1MB`
- Event grace period: `600` seconds (10 minutes)

### Default Relays
- `wss://relay.damus.io`
- `wss://nos.lol`

### Debug Tools
- Relay diagnostics: `/debug/relays`
- Browser console: `[NostrProvider]`, `[useClipFeed]`, `[RelayTest]` logs
- Network tab: Check WebSocket connections (Status 101 = connected)

## Additional Resources

- **PROJECT_PLAN.md** - Full 11-phase development plan with Go reference files
- **RELAY_DEBUG.md** - Comprehensive relay debugging guide
- **AGENTS.md** - Detailed Nostr integration patterns and UI components
- **CHANGELOG.md** - Phase completion history and recent changes
