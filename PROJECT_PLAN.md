# ✅ FINAL PROMPT (A′) — nodestr Hybrid‑Master‑Prompt (Revised)

## A) ROLE & GOAL

You are a **senior frontend engineer** tasked with building **nodestr**, a **web-based Nostr client specialized for Lightning node runners**, implementing the **CLIP (Common Lightning-node Information Payload) protocol**.

The goal is to deliver a **fully runnable, end-to-end product** that:
- reads, verifies, and displays CLIP events,
- publishes **both CLIP kinds (Node Announcement & Node Info)**,
- supports **interactive Lightning signing**,
- uses **browser-based Nostr identity (NIP‑07)**,
- and follows the CLIP reference implementation strictly.

This is a **greenfield project**.

You MUST follow the phased process and stop at defined checkpoints.

---

## B) CONTEXT & CONSTRAINTS

### Tech stack
- Web app using **React**
- UI framework: **shakespeare.diy**
- Do NOT introduce additional libraries unless clearly justified, e.g. cryptography and Nostr related tasks
- TypeScript / Vite may be used at your discretion (explain the choice)

### CLIP protocol (authoritative)
- Nostr event kind: **38171** (replaceable, addressable)
- CLIP message kinds (via `k` tag):
  - `k = 0` → **Node Announcement**
    - Requires:
      - Nostr signature
      - Lightning signature (`sig` tag)
  - `k = 1` → **Node Info**
    - Requires:
      - Nostr signature only
      - Must be signed by the **Nostr pubkey bound by the latest valid Node Announcement**

You MUST implement verification and trust logic equivalent to the Go reference implementation provided by the user:
- latest Node Announcement (by `created_at`) wins
- if Nostr pubkey changes, older events must be rejected
- invalid or unverifiable events MUST NOT be shown

### Lightning signing model
- **No Lightning keys in the browser**
- Interactive flow:
  1. nodestr generates the event hash
  2. user signs externally (lncli / CLN / etc.)
  3. user pastes the signature
  4. nodestr validates the Lightning signature
  5. nodestr performs Nostr signing (via NIP‑07)

### Identity & profiles
- Nostr identity via **NIP‑07 browser extension**
- User profile metadata: **Kind 0 only**
- “run by [nostr user]” is derived **only from the latest valid Node Announcement**

### External APIs (Node discovery)
- Default base URL: `https://mempool.space`
- Must be **configurable via application-level config (e.g. ENV)**
- Endpoints:
  - mainnet: `/api/v1/lightning/search`
  - signet: `/signet/api/v1/lightning/search`
  - testnet3: `/testnet/api/v1/lightning/search`
  - testnet4: no API → full pubkey input only

#### Base URL

- Default base URL: `https://mempool.space`
- The base URL MUST be configurable at application level
  - e.g. via environment variables or runtime configuration
- Example:
  - `MEMPOOL_BASE_URL=https://mempool.space`


#### Use Case 1: Suggestion List (Alias / Partial Search)

We have to know the network as precondition for this API call to choose the correct endpoint.

This use case is used to build a **node suggestion list** while the user types an alias or partial search string.

Request

```http
GET /api/v1/lightning/search?searchText=<query>
```

Example Request
```http
https://mempool.space/api/v1/lightning/search?searchText=foo
```

Example Response
```json
{
  "nodes": [
    {
      "public_key": "03cd1e5d7fbabd84e3e949baf0205e475a01fa916c13ec8493a7d022eacf11d4ce",
      "alias": "Foodbanker",
      "capacity": 25777215,
      "channels": 3,
      "status": 0
    },
    {
      "public_key": "03a23d220e27ef41688fe6912a3897040dd024fc53a3d2f6c9a621858c991fbfd4",
      "alias": "Pup food fund",
      "capacity": 9000000,
      "channels": 5,
      "status": 1
    }
  ],
  "channels": []
}
```

Handling Rules
- All entries in nodes[] MUST be treated as valid suggestion candidates
The status field MUST NOT be used for filtering
- For each suggestion, extract and display:
  - public_key
  - alias
  - capacity
  - channels
- Sorting and CLIP‑related checks are performed outside of this API call

#### Use Case 2: Pubkey Existence Check (Exact Match)
This use case verifies whether a specific Lightning node pubkey exists on mainnet.

Preconditions
- The API call MUST only be executed if:
  - the input length matches a Lightning pubkey
  - the input is valid hex
- Alias or malformed input MUST NOT trigger this request

##### Case 2.1: Pubkey Exists on Mainnet (Normal Case)
Request

```http
GET /api/v1/lightning/search?searchText=<full_pubkey>
```

Example Request
```http
https://mempool.space/api/v1/lightning/search?searchText=021c97a90a411ff2b10dc2a8e32de2f29d2fa49d41bfbb52bd416e460db0747d0d
```

Example Response
```json
{
  "nodes": [
    {
      "public_key": "021c97a90a411ff2b10dc2a8e32de2f29d2fa49d41bfbb52bd416e460db0747d0d",
      "alias": "LOOP",
      "capacity": 12496904205,
      "channels": 88,
      "status": 1
    }
  ],
  "channels": []
}
```
Interpretation
- Exactly one node with a matching public_key is expected
- This confirms that the node exists on mainnet
- The alias (if present) MAY be displayed to the user
- A successful lookup SHOULD be indicated with a positive visual marker, e.g. a green checkmark

##### Case 2.2: Pubkey Does Not Exist on Mainnet

Example Request

```http
https://mempool.space/api/v1/lightning/search?searchText=031b272ad3565e6f27c6097c9508c0697307ad1c8e62df6a8cd0134637e57bc9f4
```
Example Response
```json
{
  "nodes": [],
  "channels": []
}
```

Interpretation
- The pubkey is syntactically valid
- The node is unknown on mainnet
- This MUST be treated as informational only
- The UI SHOULD indicate this clearly, e.g.: “Unknown node on mainnet”
- This condition MUST NOT block:
Node Announcement publishing
Node Info publishing (for non‑mainnet networks)

### Relays
- Start with a **curated default relay list**
- User-configurable
- Do not assume NIP‑65 unless explicitly added later

### Repo access
- Do NOT fabricate repo contents
- CLIP behavior must be based only on:
  - the protocol README
  - the Go reference files (`event.go`, `client.go`, `store.go`, validator snippet)
- These files are the **source of truth**

---

## C) REQUIREMENTS

### MUST
- Full CLIP verification (k=0, k=1)
- Feed, profiles, search, publishing, DMs, settings
- App must remain runnable after every phase
- Explicit STOP points between phases
- A `README.md` must be delivered

### SHOULD
- Clean, maintainable React structure
- Clear UI states (loading / error / empty)
- Accessible, readable UI

---

## D) UI / UX SPEC

### Global layout
- Sidebar layout (similar to common Nostr clients)
- Main sections:
  - Home (Feed)
  - Search
  - Publish
  - DMs
  - Settings

---

### A) Feed
- Lists **verified CLIP events only** (k=0, k=1)
- Sorted by `created_at desc`
- Shows:
  - Lightning node alias  
    - fallback: first 20 chars of LN pubkey
  - Node avatar:
    - derived from Nostr user profile
  - “run by [nostr user]” (links to profile)
  - relative timestamp (e.g. “10m ago”)
  - badges:
    - event kind
    - network  
      - mainnet: subtle or omitted  
      - testnets/signet: distinct but soft colors
- Filters:
  - “All events”
  - “Events from followed users”
    - based on Kind 3 (Contacts) of the logged-in user
- Interaction:
  - Likes (Kind 7): allowed
  - Zaps (NIP‑57): allowed
  - Replies / reposts: NOT supported

---

### B) Profiles (Nostr Users)
- Profile page for a Nostr pubkey
- Uses Kind 0 metadata only
- Timeline shows **only CLIP events**, rendered like the Feed
- Near profile description:
  - show which Lightning nodes this user operates
  - derived from valid Node Announcements
- If user is a valid node runner:
  - allow entering DMs

---
## C) Search (Lightning Node Search)

The Search section allows users to discover Lightning nodes and determine whether they are
**operated by a verified CLIP node runner**.

Search is **node-centric**, not user-centric.

---

### C.1 Search Scope & Input

- Search input accepts:
  - Lightning node aliases
  - partial text
  - full Lightning node public keys
- All input is treated uniformly as **search text**
- A network selector MUST be present:
  - default: **mainnet**

No semantic distinction between alias and pubkey input is made at input time.

---

### C.2 Search Execution

- For every search input:
  - execute a mempool Lightning search request
  - using the **Suggestion List flow** defined in  
    **“External APIs (Node Discovery via mempool)”**
- The returned `nodes[]` list represents **candidate Lightning nodes**

The mempool API response is treated as **informational**, not authoritative.

---

### C.3 CLIP Announcement Resolution (Critical Step)

After candidate nodes are obtained from the mempool API:

1. For **each candidate Lightning node**:
   - check whether a **valid CLIP Node Announcement (k=0)** exists
   - validation MUST follow CLIP trust rules:
     - only the latest announcement counts
     - invalid or outdated announcements are ignored
2. Each search result entry MUST be annotated with:
   - ✅ **“announcement present”**
   - ❌ **“no announcement”**

This step is mandatory and independent of the selected network.

---

### C.4 Result Ordering

Search results MUST be ordered as follows:

1. Nodes **with a valid CLIP Node Announcement first**
2. Nodes **without a valid CLIP Node Announcement second**
3. Within each group:
   - sort by `capacity` in **descending order**
   - nodes with unknown capacity MUST be placed last

---

### C.5 Result Display

Each search result entry MUST display:

- Lightning node alias
  - fallback: shortened Lightning pubkey
- Lightning node pubkey
- Informations about the nostr node operator (nostr user name and nostr logo)
- Capacity
- Channel count
- Announcement status:
  - badge or equivalent visual indicator


No additional metadata may be inferred or fabricated.

---

### C.6 Interaction Rules

- Nodes **with a valid CLIP Node Announcement**:
  - MUST be clickable
  - navigation leads to the **operator’s Nostr profile**
  - profile resolution is based on the latest valid Node Announcement
- Nodes **without a valid CLIP Node Announcement**:
  - MUST be visible
  - MUST be visually disabled or inactive
  - MUST NOT allow navigation


---

## D) Publishing

### General
- Publishing is accessible via a **sidebar entry “Publish”**
- The right panel opens a guided publishing flow
- Publishing always starts with a **node selection step**, which is shared by:
  - Node Announcement
  - Node Info

---

### D.1 Node Selection (Shared, Mandatory Step)

Before any publishing action, the user must select and validate a Lightning node.

#### D.1.1 Pubkey Input & Validation
- User enters a **Lightning node public key**
- The input MUST be validated locally before any API call:
  - correct length
  - valid hex encoding
  - no alias or malformed input allowed
- If invalid:
  - show an error message, e.g.  
    **“Please enter a valid hex-encoded Lightning node public key.”**
  - stop the flow

#### D.1.2 Mempool API Lookup (Mainnet Only)
- Perform a **Pubkey Existence Check** against the mainnet mempool API
- Purpose:
  - confirm pubkey existence on mainnet
  - fetch alias if available
- Behavior:
  - If the pubkey is found:
    - show a ✅ green checkmark
    - display the alias returned by mainnet (if any)
  - If the pubkey is NOT found:
    - show a ⚠️ warning indicator
    - display: **“Unknown node on mainnet”**
- Important:
  - Failure to find a pubkey on mainnet does NOT block publishing
  - This lookup is informational only
  - Testnets, signet, and other networks are expected to fail here

#### D.1.3 CLIP Announcement Check
- After the mempool lookup:
  - check whether a **valid CLIP Node Announcement (k=0)** already exists for this node
- Result:
  - If a valid announcement exists:
    - Node Info publishing becomes selectable
  - If no valid announcement exists:
    - Node Info publishing remains **disabled/inactive**
    - Only Node Announcement is allowed

---

### D.2 Node Announcement Publishing Flow

#### Preconditions
- A valid Lightning node pubkey has been entered and validated
- Node selection step completed

#### Flow
1. Generate the CLIP Node Announcement event structure
2. Compute the **Lightning signing hash** according to the CLIP specification
3. Display the hash in a copyable field
4. Instruct the user to sign the hash externally using their Lightning node
5. User pastes the Lightning signature
6. Validate the Lightning signature:
   - signature format
   - signature correctness
   - recovered pubkey must match the entered Lightning pubkey
7. If validation fails:
   - show a clear error message
   - do not proceed
8. If validation succeeds:
   - request Nostr signing via **NIP‑07**
9. Publish the event to the configured relays
10. Show success or relay errors clearly

---

### D.3 Node Info Publishing Flow

#### Preconditions
- Node selection completed
- A **valid CLIP Node Announcement** exists for the selected node

#### Network Handling
- Node Info is **network-specific**
- The UI MUST present **network badges/tabs**
  - selecting a badge switches the active network context
- When a network is selected:
  - check whether Node Info already exists for that network
  - if it exists:
    - load it
    - prefill the form
  - if it does not exist:
    - present an empty form

#### Editing & Publishing
- The user may create or update Node Info
- Publishing always **replaces** the previous Node Info for the selected network

#### Fields (per CLIP spec)
- about
- min_channel_size_sat
- max_channel_size_sat
- contact_info
  - dynamically add/remove entries
  - at most one entry may be marked as `primary`
- custom_records
  - dynamic key/value pairs

#### Validation
- Validation MUST match the Go reference implementation exactly:
  - field constraints
  - min/max relationships
  - single primary contact rule
- Empty or unset fields MUST be omitted from the event

#### Finalization
1. Serialize Node Info payload
2. Finalize CLIP event (k=1)
3. Request Nostr signing via **NIP‑07**
4. Publish to relays
5. Display publishing result

---

### E) DMs
- Based on Nostr DMs (best practices)
- Only show conversations with **verified node runners**
- Optionally indicate associated nodes

---

### F) Settings
- Basic Nostr client settings
- Relay management (stored in localStorage, browser only):
  - curated defaults
  - user override


### G) Configuration
- Configuration (startup level):
  - mempool base URL should be configurable (e.g. ENV)

---

## E) NOSTR / CLIP SUMMARY

- Event kind: 38171
- Tags:
  - `d` — identifier
  - `k` — CLIP kind
  - `sig` — Lightning signature (k=0 only)
- Trust rules:
  - latest Node Announcement defines operator
  - Node Info must match bound Nostr pubkey
  - invalid events are discarded

---

## F) ENGINEERING RULES

- Do NOT guess protocol details
- Do NOT invent NIPs or CLIP extensions
- Do NOT code ahead of the current phase
- Follow STOP checkpoints strictly
- Keep the app runnable at all times

---

## G) DELIVERY & PROCESS (MANDATORY)

This phased plan is **explicitly designed for environments where installing external
libraries is problematic** (e.g. shakespeare.diy).  
Lightning signature cryptographic verification is therefore **intentionally deferred
to the very end**.

Until Phase 9:
> Lightning signatures — if present — are **assumed to be valid**  
> (format checks allowed, cryptographic verification skipped)

Every phase ends with a **STOP checkpoint** and a **runnable application**.

---

## Phase 0 — Understanding & Architecture
**Goal:** Establish a shared mental model and a safe foundation

- Summarize nodestr + CLIP goals
- Trust & threat model (CLIP)
- Identify risks:
  - Lightning crypto in the browser
  - Relay inconsistency
- High-level app architecture
- Data flow: events, store, verifier
- Stack decision:
  - React + shakespeare.diy
  - JS or TS (with justification)

⛔ **STOP**

---

## Phase 1 — Nostr Login & Relay Settings (Foundation)
**Goal:** Stabilize identity and connectivity

### Features
- NIP‑07 login
  - Login / logout
  - Display logged-in npub
- Relay management (browser-only)
  - **Default relays:**
    - `wss://relay.damus.io`
    - `wss://nos.lol`
  - Add / remove relays
  - Persist via localStorage
- Global app states:
  - logged out
  - connecting
  - connected
  - error (extension missing / permission denied)

⛔ **STOP (first runnable app)**

---

## Phase 2 — Event Foundations & Feed (No LN Verification Yet)
**Goal:** Read, trust-filter, and render CLIP events

### Features
- CLIP event parsing
  - Nostr kind `38171`
  - `k = 0` (Node Announcement)
  - `k = 1` (Node Info)
- Identifier parsing (`d`, `k`, network)
- Store logic:
  - latest Node Announcement wins
  - nostr pubkey change invalidates older events
- Feed:
  - show **formally valid** CLIP events only
  - sorted by `created_at desc`
  - badges: CLIP kind, network
- Lightning signatures:
  - presence + format checks only
  - **no cryptographic verification**

⛔ **STOP**

---

## Phase 3 — Nostr Profiles (Operator‑Centric)
**Goal:** Establish operator identity as a first‑class concept

### Features
- Profile pages for Nostr pubkeys
- Kind 0 metadata only
- Operator timeline:
  - CLIP events only (`k=0`, `k=1`)
- “Operates Lightning nodes” section:
  - derived from valid Node Announcements
- Navigation:
  - from feed → profile
- Profile‑level empty / loading / error states

⛔ **STOP**

---

## Phase 4 — Mempool API & Lightning Node Discovery
**Goal:** Discover Lightning nodes via external data

### Features
- Mempool API integration
  - configurable base URL
  - networks: mainnet / testnet / signet
- Search input:
  - alias / partial text
  - full Lightning pubkey
- Suggestion list (alias / partial search)


⛔ **STOP**

---

## Phase 5 — CLIP‑Aware Search Resolution & Navigation
**Goal:** Bind Lightning nodes to verified Nostr operators

### Features
- CLIP Node Announcement resolution per search result
- Annotation:
  - ✅ announcement present
  - ❌ no announcement
- Result ordering:
  1. nodes with valid announcement
  2. nodes without announcement
  3. capacity (descending)
- Interaction rules:
  - nodes with announcement → clickable
  - navigation → operator profile
  - nodes without announcement → disabled

⛔ **STOP**

---

## Phase 6 — Publishing: Node Selection & Preparation
**Goal:** Prepare publishing flows without crypto complexity

### Features
- Shared node selection step
  - Lightning pubkey input
  - local validation (hex, length)
- Mempool Pubkey existence check (mainnet)
- Visual indicators:
  - ✅ found on mainnet
  - ⚠️ unknown on mainnet
- CLIP Node Announcement existence check
- Gating:
  - Node Info publishing only if announcement exists
- Wizard‑style UI foundation

⛔ **STOP**

---

## Phase 7 — Publishing: Node Announcement (No LN Verification Yet)
**Goal:** Establish trust anchors with simplified assumptions

### Features
- Build `k=0` Node Announcement event
- Event hash generation
- Lightning signature input
  - format validation only
  - **assume signature is valid**
- NIP‑07 signing
- Publish to relays
- Clear success / error feedback

⛔ **STOP**

---

## Phase 8 — Publishing: Node Info (Full UX, No LN Crypto)
**Goal:** Complete CLIP Node Info publishing

### Features
- Network selector / tabs
- Load existing Node Info per network
- Node Info editor:
  - `about`
  - `min_channel_size_sat`
  - `max_channel_size_sat`
  - `contact_info` (single primary rule)
  - `custom_records`
- Validation **exactly matching Go reference**
- Replace semantics
- NIP‑07 signing & publish

⛔ **STOP**


---

## Phase 9 — DMs, Settings, Polishing
**Goal:** Product readiness

### Features
- DMs (only with verified node runners)
- Settings:
  - relay management
  - mempool base URL
- UX polish:
  - loading / empty / error states

⛔ **STOP (critical milestone)**

---

## Phase 10 — Lightning Signature Cryptographic Verification
**Goal:** Introduce Lightning crypto only when the app is otherwise complete

### Features
- Minimal, well‑audited crypto dependencies:
  - zbase32 decoding
  - secp256k1 compact signature recovery
  - double SHA‑256 hashing
- Verification **exactly per Go reference**:
  - hash without `sig`
  - recover Lightning pubkey
  - match against `d` tag pubkey
- Enforcement:
  - Node Announcements **must** have valid LN signatures
  - remove all “assume valid” logic

⛔ **STOP (critical milestone)**

---

## Phase 11 —  README
**Goal:** Product readiness

### Features
- `README.md`:
  - project purpose
  - CLIP overview
  - security model
  - development setup




⛔ **FINAL STOP**

---

## H) DELIVERABLES

- Fully runnable React app
- Clear file structure
- `README.md`
- Commands to run and test
- Manual CLIP verification steps

---

## I) CLARIFICATIONS 


### 1) Announcement fetch window (critical trust anchor)
Confirmed.

✅ **Node Announcements (k=0) must be fetched unbounded or at least 1 year back**, independent of the feed/UI time window.

Rationale:
- A valid Node Info MUST NOT be rejected just because the latest valid announcement is older than the feed window.
- This mirrors the implicit behavior of the Go client and CLIP trust semantics.

Implementation guidance (later):
- Announcements: fetch with a long window (≥ 1 year or effectively unbounded with sane limits).
- Feed / Node Info rendering: can still be time-windowed at the UI level.

---

### 2) Allowed networks (`IsValidNetwork`)


✅ Validation must accept **exactly the network values defined by the Go reference**.  
✅ Validation is **case‑sensitive**.  
✅ Node Info events with any other network value MUST be rejected.

Note:
- Even if some networks are not exposed in the UI initially, **validation must support all of them**.
- Do not infer, normalize, or alias network names.

```golang
func IsValidNetwork(network string) bool {
switch network {
case "mainnet", "testnet", "testnet4", "signet", "simnet", "regtest":
return true
default:
return false
}
}
```

---

### 3) CombinedSigner & signing order

✅ The signing order is **strict and must be mirrored exactly**:
1. The event must already be finalized (`d` and `k` tags set).
2. If the event is a Node Announcement (`k=0`):
   - The Lightning signature (`sig` tag) is added **first**, signing the event hash.
3. The Nostr signature is added **last**, signing the final event including the `sig` tag.

This removes all ambiguity around signing order and tag inclusion.


```golang
type CombinedSigner struct {
// Interface to sign with nostr pk
NostrSigner nostr.Signer
// Interface to sign with ln identity key
LnSigner LnSigner
}
func (s CombinedSigner) SignEvent(ctx context.Context, ev Event) error {
if !ev.IsFinalized() {
return fmt.Errorf("event not finalized")
}
if ev.RequiresLnSignature() {
if err := s.signWithLn(ctx, ev); err != nil {
return fmt.Errorf("signing with ln: %w", err)
}
}
if err := s.NostrSigner.SignEvent(ctx, ev.NostrEvent); err != nil {
return fmt.Errorf("signing with nostr: %w", err)
}
return nil
}
func (s CombinedSigner) signWithLn(ctx context.Context, ev Event) error {
if ev.NostrEvent.Tags.Find("sig") != nil {
return fmt.Errorf("event already has a 'sig' tag")
}
// Signing the event with the Lightning node.
sig, err := s.LnSigner.SignMessage(ctx, ev.Hash())
if err != nil {
return err
}
ev.NostrEvent.Tags = append(ev.NostrEvent.Tags, nostr.Tag{"sig", sig})
return nil
}
```

---

### 4) Lightning message signing compatibility

✅ LND, CLN, and Eclair use the **same message signing scheme** for signed messages.
✅ Users must sign interactively, so incompatible schemes are naturally excluded.
✅ Verification must strictly implement the Go logic (no heuristics, no fallbacks).

Conclusion:
- Remain **strictly Go‑compatible**
- Do not introduce alternate or extended verification paths

---

### 5) Node Announcement content (`""` vs `"{}"`)

✅ Verification:
- Accept both empty string and `"{}"` as valid content.

✅ Publishing:
- nodestr should publish `"{}"` for Node Announcements, matching Go behavior.

---

### 6) Crypto dependencies

✅ Minimal, well‑audited crypto dependencies are allowed **only** to replicate Go behavior:
- secp256k1 compact signature recovery
- zbase32 decoding
- double SHA‑256 hashing

❌ No custom crypto implementations  
❌ No speculative extensions

---



**Begin with Phase 0. Do not skip phases.**
----------------------
----------------------
----------------------


---- --- ATTACHED FILES ---

----------------------
----------------------
----------------------


### Attached file: README.md

# CLIP - Common Lightning-node Information Payload (via Nostr)

**⚠️ Early Stage Project: This is a first protocol draft and experimental implementation.**

CLIP is a proposed protocol and CLI tool for publishing and discovering verifiable Lightning Network node information over Nostr. It aims to enable Lightning node operators to share extended metadata about their nodes (contact information, policies, requirements, etc.) in a decentralized manner.

## Table of Contents

- [Problem Statement](#problem-statement)
- [Protocol Description](#protocol-description)
  - [Event Tags](#event-tags)
  - [Message Types](#message-types)
- [Installation](#installation)
- [Getting Started](#getting-started)
  - [Generating a Nostr Key](#generating-a-nostr-key)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [CLI Commands](#cli-commands)
  - [Publishing Node Information](#publishing-node-information)
  - [Querying Node Information](#querying-node-information)
- [Operating Modes](#operating-modes)
  - [LND Mode](#lnd-mode)
  - [Interactive Mode](#interactive-mode)
- [Example Configuration](#example-configuration)
- [License](#license)


## Problem Statement

Lightning Network nodes currently have limited ways to share operational information beyond what's available in the gossip protocol. Node operators may want to:

- Share contact information (Nostr, email, other channels), which also works in case the node is offline.
- Announce operational policies (acceptance criteria, closing policies, maintenance schedules).
- Provide arbitrary information useful for the other nodes.

While it's already possible to share such information via Nostr or centralized directories, there is no standardized way to cryptographically verify that the information actually originates from the operator of a specific Lightning node. CLIP addresses this verification challenge by linking Lightning node signatures with Nostr identities.

## Protocol Description

CLIP uses Nostr events with kind **38171** (addressable event) to publish Lightning node information. As an addressable event, relays only need to store the most recent version for each unique combination of `d` tag and author pubkey (npub), automatically replacing older versions.

### Event Tags

- **`d` tag** (identifier): Unique identifier for the event
  - For Node Announcements: `<lightning_pubkey>`
  - For Node Info: `<kind>:<lightning_pubkey>:<network>` (e.g., `1:03abc...def:mainnet`)
  
- **`k` tag** (kind): CLIP message kind
  - `0` = Node Announcement (trust anchor, requires Lightning signature)
  - `1` = Node Info (metadata, no Lightning signature required)

- **`sig` tag** (Lightning signature): Present only on Node Announcements
  - Format: zbase32-encoded signature created by the Lightning node's identity key
  - Signs the Nostr event ID (hex-encoded SHA256 hash of the event without the `sig` tag). This hash is computed over the event fields including the Nostr public key and the Lightning node public key (`d` tag)
  - During verification, the signing node's public key can be recovered from the signature and compared with the public key in the `d` tag to ensure authenticity

### Message Types

**Node Announcement (Kind 0)** - An announcement with empty content that serves as a trust anchor for a Lightning node. This message must be signed by both the Lightning node's identity key (via the `sig` tag) and a Nostr key (standard Nostr signature). Once published, it links the Lightning node's public key to a specific Nostr public key (npub).

If a new Node Announcement is published with a different Nostr key, relays will store both announcements (different author pubkeys). However, CLIP clients must only accept messages signed by the most recently announced Nostr key (determined by `created_at` timestamp), as the previous Nostr key may have been compromised. All other messages signed with the previous Nostr key must be rejected by the client.

**Node Info (Kind 1)** - Contains detailed information about the Lightning node (contact info, channel policies, operational metadata, etc.). The content is structured as JSON with predefined fields to ensure consistent parsing and interpretation across different users. The `custom_records` field allows for arbitrary key-value pairs beyond the standardized fields. This message type does not require a Lightning signature and only needs to be signed by the Nostr key that was bound in the Node Announcement.

Example content structure:
```json
{
  "about": "Human-readable description of the node",
  "max_channel_size_sat": 16777215,
  "min_channel_size_sat": 40000,
  "contact_info": [
    {
      "type": "nostr",
      "value": "npub1...",
      "note": "Primary contact method",
      "primary": true
    },
    {
      "type": "email",
      "value": "node@example.com"
    }
  ],
  "custom_records": {
    "acceptance_policy": "Accepting all channel requests",
    "closing_policy": "Will not force-close channels",
    "scheduled_maintenance": "First Sunday of each month, 02:00-04:00 UTC"
  }
}
```

## Installation

```bash
# Clone the repository
git clone https://github.com/feelancer21/clip.git
cd clip

# Install the CLI tool
make install
```

## Getting Started

### Generating a Nostr Key

`clip-cli` requires a Nostr private key (nsec) to sign events. You can either:

1. **Generate a new key**:
   ```bash
   clip-cli generatekey
   ```
   This creates a new key and saves it to `~/.config/clip/key`

2. **Use an existing key**: If you already have a Nostr key, save it to the key file:
   ```bash
   echo "nsec1your_private_key_here" > ~/.config/clip/key
   chmod 600 ~/.config/clip/key
   ```

**Note**: You can use any Nostr private key. It doesn't have to be generated by `clip-cli`. However, keep in mind that this key will be permanently associated with your Lightning node via the Node Announcement.

### Configuration

Create a configuration file at `~/.config/clip/config.yaml`:

```bash
mkdir -p ~/.config/clip
nano ~/.config/clip/config.yaml
```

See [Example Configuration](#example-configuration) below for a complete configuration template.

## Usage

### CLI Commands

```
NAME:
   clip-cli - CLIP (Common Lightning-node Information Payloader) - Sending and receiving verifiable Lightning node information over Nostr.

USAGE:
   clip-cli [global options] command [command options]

COMMANDS:
   getinfo                     Returns basic information about the connected Lightning node.
   generatekey                 Generates a new private key for Nostr.
   listnodeannouncements, lna  Fetches all node announcement events from the configured Nostr relays and displays them.
   listnodeinfo, lni           Fetches all node information from the configured Nostr relays and displays it.
   pubnodeannounce, pna        Publishes a node announcement event to the configured Nostr relays.
   pubnodeinfo, pni            Publishes the node information specified in the config to the configured Nostr relays.
   help, h                     Shows a list of commands or help for one command

GLOBAL OPTIONS:
   --config value  name of the config file (default ~/.config/clip/config.yaml)
   --help, -h      show help
   --version, -v   print the version
```

### Publishing Node Information

#### Step 1: Publish Node Announcement

First, publish a Node Announcement to link your Lightning node to your Nostr identity:

```bash
clip-cli pubnodeannounce
# or
clip-cli pna
```

This command:
- Creates a Node Announcement event
- Signs it with your Lightning node's identity key
- Signs it with your Nostr key
- Publishes it to the configured relays

#### Step 2: Publish Node Info

After the announcement, you can publish your node's metadata:

```bash
clip-cli pubnodeinfo
# or
clip-cli pni
```

This publishes the `node_info` section from your configuration file to the relays.

Node Info events do not require a Lightning signature. They only need to be signed by the Nostr key that was bound in the Node Announcement.

### Querying Node Information

#### List Node Announcements

```bash
# List all node announcements
clip-cli listnodeannouncements
# or 
clip-cli lna

# List announcements from the last 7 days (default: 60 days)
clip-cli lna --since 168h

# List for a specific Lightning node (default: all nodes)
clip-cli lna --pubkey 03abc...def
```

#### List Node Info

```bash
# List all node info
clip-cli listnodeinfo
# or 
clip-cli lni

# Filter by time and node
clip-cli lni --since 24h --pubkey 03abc...def

```

## Operating Modes

### LND Mode

Connects directly to an LND node via gRPC for automated signing.
```yaml
lnclient: "lnd"
lnd:
  host: "localhost"
  port: 10009
  tls_cert_path: "/path/to/your/tls.cert"
  macaroon_path: "/path/to/your/macaroon.macaroon"
```
The provided macaroon must have permissions for `lnrpc.SignMessage`, `lnrpc.GetInfo` and `lnrpc.GetNodeInfo`. An `admin.macaroon` is not strictly required but is the most convenient option.

### Interactive Mode

Prompts for manual signing, making it compatible with any Lightning implementation (e.g., LND, CLN, Eclair).
```yaml
lnclient: "interactive"
interactive:
  network: "mainnet"
  pub_key: "03abc...def"
```
Use `lncli signmessage` or another API to sign the message prompted by the CLI.

## Example Configuration

A complete example configuration file can be found in [`config.example.yaml`](config.example.yaml). You can copy this file to `~/.config/clip/config.yaml` and edit it to your needs.

### Configuration Notes

- **Relay URLs**: Choose a mix of well-known relays for reliability.

- **Privacy**: Be mindful of the information you share publicly. Only include what you are comfortable making available to anyone on the internet. For enhanced privacy, consider running your communication with Nostr relays through a VPN to obfuscate your IP address.
  
- **Node Info Fields**: All fields under `node_info` are optional. Only include information you want to make public.
  
- **Contact Info**: You can have multiple contact methods. Set `primary: true` on your preferred method (only one contact can be primary).

- **Security**: The Nostr key is stored as plain text. Keep your key file (`key_store_path`) secure with appropriate file permissions (600). Back up your Nostr private key securely, as it allows you to publish information even when your Lightning node is down.

## License

See [LICENSE](LICENSE) file for details.

----------------------
----------------------
----------------------


### Attached file: client.go

package clip

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/nbd-wtf/go-nostr"
)

type Client struct {
	// Responsible for publishing and subscribing to events
	pool *nostr.SimplePool

	// A simple in-memory store
	store *MapStore

	// Responsible for signing events
	signer EventSigner

	// Responsible for interacting with the Lightning node (signing, getting info, etc)
	ln LightningNode

	// Nostr pubkey
	pub string

	// Cache of the node info
	info NodeInfoResponse
}

func NewClient(ctx context.Context, nostrSigner nostr.Signer, ln LightningNode) (*Client, error) {
	combinedSigner := &CombinedSigner{
		NostrSigner: nostrSigner,
		LnSigner:    ln,
	}

	c := &Client{
		pool:   nostr.NewSimplePool(ctx),
		store:  NewMapStore(),
		signer: combinedSigner,
		ln:     ln,
	}

	initCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// Caching the nostr public key now
	pub, err := nostrSigner.GetPublicKey(initCtx)
	if err != nil {
		return nil, err
	}
	c.pub = pub

	// Caching info of the node now (network, pubkey, etc)
	info, err := c.GetNodeInfo(initCtx)
	if err != nil {
		return nil, err
	}
	c.info = info
	return c, nil
}

func (c *Client) GetNodeInfo(ctx context.Context) (NodeInfoResponse, error) {
	info, err := c.ln.GetNodeInfo(ctx)
	if err == nil && !info.checkNetwork() {
		err = fmt.Errorf("invalid network: %s", info.Network)
	}
	return info, err
}

// GetEvents fetches events from relays and returns them along with any errors encountered.
// Return values: ([]*Event, error, []error)
// - error (2nd return): Critical errors that prevent operation (returned immediately)
// - []error (3rd return): Non-fatal warnings collected during processing (fetchErrors)
//
// fetchErrors are designed NOT to interrupt execution. They collect recoverable issues like:
// - Individual event verification failures
// - Event storage failures
// - Relay-specific errors
// This allows partial success: valid events are returned even if some events/relays fail.
func (c *Client) GetEvents(ctx context.Context, kind Kind, pubkeys map[string]struct{}, urls []string,
	from time.Time) ([]*Event, error, []error) {

	since := nostr.Timestamp(from.Unix())
	filter := nostr.Filter{
		Kinds: []int{KindLightningInformation},
		Since: &since,
	}

	var fetchErrors []error
	// We have to sync our store twice: once for node announcements and
	// once for the specific kind. Node announcements have to be fetched
	// first to ensure that we have all relevant announcements in our store
	// when processing the other kinds.
	filter.Tags = nostr.TagMap{"k": {strconv.Itoa(int(KindNodeAnnouncement))}}
	err, err2 := c.syncStoreWithPool(ctx, urls, filter)
	if err != nil {
		return nil, fmt.Errorf("fetching node announcements: %v", err), nil
	}
	fetchErrors = append(fetchErrors, err2...)

	if kind != KindNodeAnnouncement {
		filter.Tags = nostr.TagMap{"k": {strconv.Itoa(int(kind))}}
		err, err2 = c.syncStoreWithPool(ctx, urls, filter)
		if err != nil {
			return nil, fmt.Errorf("fetching events of kind %d: %v", kind, err), nil
		}
		fetchErrors = append(fetchErrors, err2...)
	}
	return c.store.GetEvents(kind, pubkeys), nil, fetchErrors
}

// syncStoreWithPool fetches events from the given URLs using the provided filter
// and stores them in the client's store.
// Returns (error, []error): critical error + non-fatal warnings (fetchErrors).
// fetchErrors collect per-event issues without stopping the fetch process,
// enabling resilient operation across multiple relays and events.
func (c *Client) syncStoreWithPool(ctx context.Context, urls []string, filter nostr.Filter) (error, []error) {

	var fetchErrors []error
	appendErrs := func(err error) { fetchErrors = append(fetchErrors, err) }

	res := c.pool.FetchManyReplaceable(ctx, urls, filter)

	res.Range(func(k nostr.ReplaceableKey, ev *nostr.Event) bool {
		if err := ctx.Err(); err != nil {
			return false
		}
		// Process each event
		lev, err := NewEventFromNostrRelay(ev)
		if err != nil {
			appendErrs(fmt.Errorf("creating event from nostr relay: %v", err))
			return true
		}

		if ok, err := lev.Verify(); !ok || err != nil {
			appendErrs(fmt.Errorf("invalid event %v: %v", lev.NostrEvent.ID, err))
			return true
		}
		if err := c.store.StoreEvent(lev); err != nil {
			appendErrs(fmt.Errorf("storing event failed %v: %v", lev.NostrEvent.ID, err))
		}

		return true
	})

	if ctx.Err() != nil {
		return ctx.Err(), nil
	}
	return nil, fetchErrors
}

// GetEventEnvelopes wraps events with additional metadata (like node aliases).
// Like GetEvents, it returns ([]EventEnvelope, error, []error) where fetchErrors
// accumulate non-critical issues (envelope creation failures, alias lookup failures)
// without interrupting the overall operation.
func GetEventEnvelopes[T any](c *Client, ctx context.Context, kind Kind, pubkeys map[string]struct{},
	urls []string, from time.Time) ([]EventEnvelope[T], error, []error) {

	events, err, fetchErrors := c.GetEvents(ctx, kind, pubkeys, urls, from)
	if err != nil {
		return nil, err, nil
	}

	envelopes := make([]EventEnvelope[T], 0, len(events))
	for _, ev := range events {
		env, err := NewEventEnvelope[T](ev)
		if err != nil {
			fetchErrors = append(fetchErrors, fmt.Errorf("creating event envelope: %v", err))
			continue
		}
		alias, err := c.ln.GetAlias(ctx, env.Id.PubKey)
		if err != nil {
			// We can continue with empty alias if it fails.
			fetchErrors = append(fetchErrors, fmt.Errorf("getting alias for pubkey %s: %v", env.Id.PubKey, err))
		}
		env.Alias = alias
		envelopes = append(envelopes, *env)
	}

	return envelopes, nil, fetchErrors
}

type PublishResult struct {
	Event   *nostr.Event
	Channel chan nostr.PublishResult
}

func (c *Client) Publish(ctx context.Context, data any, kind Kind, urls []string,
	opts ...string) (PublishResult, error) {

	// Serialize to JSON for Nostr event content
	b, err := json.Marshal(data)
	if err != nil {
		return PublishResult{}, fmt.Errorf("marshaling node info: %w", err)
	}

	ev := Event{NostrEvent: &nostr.Event{
		PubKey:    c.pub,
		CreatedAt: nostr.Now(),
		Content:   string(b),
	}}

	if err := ev.Finalize(c.info.Network, c.info.PubKey, kind, opts); err != nil {
		return PublishResult{}, fmt.Errorf("finalizing event: %w", err)
	}
	if err := c.signer.SignEvent(ctx, &ev); err != nil {
		return PublishResult{}, fmt.Errorf("signing event: %w", err)
	}

	// We verify before publishing, especially to ensure the LN signature is valid.
	if ok, err := ev.Verify(); !ok || err != nil {
		return PublishResult{}, fmt.Errorf("verifying event before publish: %v", err)
	}

	res := c.pool.PublishMany(ctx, urls, *ev.NostrEvent)
	return PublishResult{Event: ev.NostrEvent, Channel: res}, nil
}

func (c *Client) Close() error {
	c.pool.Close("")
	return c.ln.Close()
}

----------------------
----------------------
----------------------


### Attached file: event.go

package clip

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/btcsuite/btcd/btcec/v2/ecdsa"
	"github.com/btcsuite/btcd/chaincfg/chainhash"
	"github.com/nbd-wtf/go-nostr"
	"github.com/nbd-wtf/go-nostr/nip19"
	"github.com/tv42/zbase32"
)

type Kind int

const (
	// Define a new nip1 kind
	KindLightningInformation int = 38171

	KindNodeAnnouncement Kind = 0
	KindNodeInfo         Kind = 1

	MaxContentSize = 1 * 1024 * 1024 // 1 MB

	EventGracePeriodSeconds = 600 // 10 minutes
)

var (
	// Prefix used by lnd.
	signedMsgPrefix = []byte("Lightning Signed Message:")
)

type Event struct {
	NostrEvent *nostr.Event

	// Set during Finalize
	kind      Kind
	finalized bool

	// Identifier for the event
	id *Identifier
}

func NewEventFromNostrRelay(ev *nostr.Event) (*Event, error) {
	e := &Event{
		NostrEvent: ev,
	}
	id, err := e.GetIdentifier()
	if err != nil {
		return nil, fmt.Errorf("getting identifier: %w", err)
	}
	e.kind = id.Kind
	e.finalized = true
	return e, nil
}

// Hash returns the hash of the event to be signed. We use the ID of a preliminary event,
// which is the hex-encoded sha256 of the serialized event without the 'sig' tags.
func (e *Event) Hash() []byte {
	return []byte(e.copyWithoutSig().GetID())
}

// copyWithoutSig removes the signatures from the event and returns a copy.
func (e *Event) copyWithoutSig() *nostr.Event {
	var filteredTags nostr.Tags
	for _, tag := range e.NostrEvent.Tags {
		if len(tag) > 0 && tag[0] == "sig" {
			continue
		}
		filteredTags = append(filteredTags, tag)
	}

	return &nostr.Event{
		PubKey:    e.NostrEvent.PubKey,
		CreatedAt: e.NostrEvent.CreatedAt,
		Kind:      e.NostrEvent.Kind,
		Tags:      filteredTags,
		Content:   e.NostrEvent.Content,
	}
}

func (e *Event) Finalize(network string, pubkey string, kind Kind, opts []string) error {
	ev := e.NostrEvent
	for _, t := range []string{"d", "k"} {
		if ev.Tags.Find(t) != nil {
			return fmt.Errorf("event already has a '%s' tag", t)
		}
	}

	kindStr := strconv.Itoa(int(kind))

	// Constructing the "d" tag  --
	var tagD string
	switch kind {
	case KindNodeAnnouncement:
		// "d" tag is just the pubkey for node announcements
		tagD = pubkey
	default:
		// otherwise kind:pubkey:network:opts...
		parts := append([]string{kindStr, pubkey, network}, opts...)
		tagD = strings.Join(parts, ":")
	}

	e.kind = kind
	ev.Kind = KindLightningInformation
	ev.Tags = append(ev.Tags,
		nostr.Tag{"d", tagD},
		nostr.Tag{"k", kindStr},
	)
	e.finalized = true
	return nil
}

func (e *Event) IsFinalized() bool {
	return e.finalized
}

func (e *Event) Verify() (bool, error) {
	createdAtLimitUpper := nostr.Now() + EventGracePeriodSeconds
	if e.NostrEvent.CreatedAt > createdAtLimitUpper {
		return false, fmt.Errorf("event is too far in the future")
	}

	// See https://github.com/nbd-wtf/go-nostr/pull/119
	if e.NostrEvent.ID != e.NostrEvent.GetID() {
		return false, fmt.Errorf("event ID mismatch")
	}

	// Checking that the content size is within limits
	if len(e.NostrEvent.Content) > MaxContentSize {
		return false, fmt.Errorf("content size exceeds (%d bytes) maximum limit (%d bytes)",
			len(e.NostrEvent.Content), MaxContentSize)
	}

	// Checking that the public key matches the one in the 'd' tag
	idx, err := e.GetIdentifier()
	if err != nil {
		return false, err
	}

	if idx.Kind != KindNodeAnnouncement {
		if !IsValidNetwork(idx.Network) {
			return false, fmt.Errorf("invalid network: %s", idx.Network)
		}
	}

	k := e.NostrEvent.Tags.Find("k")
	// Integrity checks
	if k == nil || len(k) < 2 || k[1] != strconv.Itoa(int(idx.Kind)) {
		return false, fmt.Errorf("missing or invalid 'k' tag")
	}

	// Checking nostr signature first
	if ok, err := e.NostrEvent.CheckSignature(); err != nil || !ok {
		return false, err
	}

	if e.RequiresLnSignature() {
		ok, err := e.checkLightningSig(idx.PubKey)
		if err != nil || !ok {
			return false, err
		}
	}
	return true, nil
}

func (e *Event) checkLightningSig(pubKeyID string) (bool, error) {
	// Extracting the ln signature and checking there is exactly one

	var sigs []nostr.Tag
	// GetAll deprecated, using FindAll instead
	for t := range e.NostrEvent.Tags.FindAll("sig") {
		sigs = append(sigs, t)
	}
	if len(sigs) > 1 {
		return false, fmt.Errorf("more than one 'sig' tag")
	}
	if len(sigs) == 0 {
		return false, fmt.Errorf("no 'sig' tag found")
	}
	sig := sigs[0][1]

	// Verifying signature according to lnd's code
	// https://github.com/lightningnetwork/lnd/blob/9a7b526c0cf35ebf03d91c773dbaa0ce7d20f323/rpcserver.go#L1762
	s, err := zbase32.DecodeString(sig)
	if err != nil {
		return false, fmt.Errorf("decoding signature: %w", err)
	}

	msg := e.Hash()
	b := chainhash.DoubleHashB(append(signedMsgPrefix, msg[:]...))

	pubKey, _, err := ecdsa.RecoverCompact(s, b)
	if err != nil {
		return false, fmt.Errorf("recovering public key: %w", err)
	}

	pubKeyHex := hex.EncodeToString(pubKey.SerializeCompressed())
	if pubKeyHex != pubKeyID {
		return false, fmt.Errorf("public key does not match")
	}
	return true, nil
}

func (e *Event) RequiresLnSignature() bool {
	switch e.kind {
	case KindNodeAnnouncement:
		return true
	}
	return false
}

type Identifier struct {
	TagD    string   `json:"tag_d"`
	Network string   `json:"network"`
	PubKey  string   `json:"pub_key"`
	Kind    Kind     `json:"kind"`
	Opts    []string `json:"opts"`
}

func (e *Event) GetIdentifier() (*Identifier, error) {
	if e.id != nil {
		return e.id, nil
	}

	tagD := e.NostrEvent.Tags.Find("d")
	if tagD == nil || len(tagD) < 2 {
		return nil, fmt.Errorf("missing or invalid 'd' tag")
	}

	tagK := e.NostrEvent.Tags.Find("k")
	if tagK == nil || len(tagK) < 2 {
		return nil, fmt.Errorf("missing or invalid 'k' tag")
	}

	kindInt, err := strconv.Atoi(tagK[1])
	if err != nil {
		return nil, fmt.Errorf("invalid kind in 'k' tag: %w", err)
	}
	kind := Kind(kindInt)

	id := &Identifier{
		TagD: tagD[1],
		Kind: kind,
	}

	switch kind {
	case KindNodeAnnouncement:
		id.PubKey = tagD[1]
		id.Opts = []string{}
	default:
		parts := strings.Split(tagD[1], ":")
		if len(parts) < 3 {
			return nil, fmt.Errorf("invalid 'd' tag format for kind %d", kind)
		}
		
		id.PubKey = parts[1]
		id.Network = parts[2]
		id.Opts = parts[3:]
	}

	e.id = id
	return e.id, nil
}

type EventEnvelope[T any] struct {
	Id        *Identifier `json:"id"`
	Alias     string      `json:"alias"`
	NostrId   string      `json:"nostr_id"`
	Npub      string      `json:"npub"`
	CreatedAt int64       `json:"created_at"`
	Payload   *T          `json:"payload"`
}

func NewEventEnvelope[T any](ev *Event) (*EventEnvelope[T], error) {
	var payload T
	if err := json.Unmarshal([]byte(ev.NostrEvent.Content), &payload); err != nil {
		return nil, err
	}
	id, err := ev.GetIdentifier()
	if err != nil {
		return nil, err
	}

	npub, err := nip19.EncodePublicKey(ev.NostrEvent.PubKey)
	if err != nil {
		return nil, err
	}

	return &EventEnvelope[T]{
		Id:        id,
		NostrId:   ev.NostrEvent.ID,
		CreatedAt: int64(ev.NostrEvent.CreatedAt),
		Npub:      npub,
		Payload:   &payload,
	}, nil
}

----------------------
----------------------
----------------------


### Attached file: store.go

package clip

import (
	"fmt"
	"sync"

	"github.com/nbd-wtf/go-nostr"
)

type announcementState struct {
	createdAt nostr.Timestamp
	pub       string
}

type nodeState struct {
	mu               sync.RWMutex
	lastAnnouncement announcementState

	// map with 'd' tag as key
	events map[string]*Event
}

func newNodeState() *nodeState {
	return &nodeState{
		events: make(map[string]*Event),
	}
}

type MapStore struct {
	mu sync.RWMutex
	// map with node pubkey as key
	records map[string]*nodeState
}

func NewMapStore() *MapStore {
	return &MapStore{
		records: make(map[string]*nodeState),
	}
}

func (s *MapStore) StoreEvent(ev *Event) error {
	id, err := ev.GetIdentifier()
	if err != nil {
		return err
	}

	ns := s.getNodeState(id.PubKey)

	ns.mu.Lock()
	defer ns.mu.Unlock()

	if ev.kind == KindNodeAnnouncement {
		return s.storeAnnouncement(ns, ev, id)
	}

	return s.storeRegularEvent(ns, ev, id)
}

func (s *MapStore) storeAnnouncement(ns *nodeState, ev *Event, id *Identifier) error {
	// Skip if existing announcement is newer or same
	if ns.lastAnnouncement.createdAt >= ev.NostrEvent.CreatedAt {
		return fmt.Errorf("existing announcement is newer or same: %d >= %d",
			ns.lastAnnouncement.createdAt, ev.NostrEvent.CreatedAt)
	}

	// Purge old events if pubkey changed (potential nsec compromise)
	if ns.lastAnnouncement.pub != ev.NostrEvent.PubKey {
		ns.events = make(map[string]*Event)
	}

	// Store the new announcement
	ns.events[id.TagD] = ev
	ns.lastAnnouncement = announcementState{
		createdAt: ev.NostrEvent.CreatedAt,
		pub:       ev.NostrEvent.PubKey,
	}

	return nil
}

func (s *MapStore) storeRegularEvent(ns *nodeState, ev *Event, id *Identifier) error {
	// Only accept events matching the last announcement pubkey
	if ns.lastAnnouncement.pub != ev.NostrEvent.PubKey {
		return fmt.Errorf("event pubkey %s does not match last announcement pubkey %s",
			ev.NostrEvent.PubKey, ns.lastAnnouncement.pub)
	}

	// Skip if existing record is newer or same
	if lastRecord, exists := ns.events[id.TagD]; exists {
		if lastRecord.NostrEvent.CreatedAt >= ev.NostrEvent.CreatedAt {
			return fmt.Errorf("existing record is newer or same: %d >= %d",
				lastRecord.NostrEvent.CreatedAt, ev.NostrEvent.CreatedAt)
		}
	}

	ns.events[id.TagD] = ev
	return nil
}

func (s *MapStore) getNodeState(pubkey string) *nodeState {
	// Fast path: read lock to check if exists
	s.mu.RLock()
	ns, exists := s.records[pubkey]
	s.mu.RUnlock()

	if exists {
		return ns
	}

	// Slow path: write lock to create if still missing
	s.mu.Lock()
	defer s.mu.Unlock()

	// Double-check: might have been created by another goroutine
	ns, exists = s.records[pubkey]
	if exists {
		return ns
	}

	// Create new node state
	ns = newNodeState()
	s.records[pubkey] = ns
	return ns
}

func (s *MapStore) GetEvents(kind Kind, pubKeys map[string]struct{}) []*Event {
	events := []*Event{}

	pubFilter := newInFilter[string](pubKeys)

	// Snapshot node pointers
	s.mu.RLock()
	nodes := make([]*nodeState, 0, len(s.records))
	for pubKey, ns := range s.records {
		if !pubFilter(pubKey) {
			continue
		}
		nodes = append(nodes, ns)
	}
	s.mu.RUnlock()

	for _, ns := range nodes {
		ns.mu.RLock()
		for _, ev := range ns.events {
			if ev.kind != kind {
				continue
			}
			events = append(events, ev)
		}
		ns.mu.RUnlock()
	}
	return events
}

// newInFilter returns a filter function that checks if an item is in the provided set.
// If the set is empty, all items are considered to be in the set.
func newInFilter[T comparable](set map[T]struct{}) func(T) bool {
	return func(item T) bool {
		if len(set) == 0 {
			return true
		}
		_, exists := set[item]
		return exists
	}
}

----------------------
----------------------
----------------------


### Attached file: payloads.go

package clip

import (
	"errors"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type NodeAnnouncement struct{}

type NodeInfo struct {
	About             *string           `json:"about,omitempty" yaml:"about,omitempty"`
	MaxChannelSizeSat *uint64           `json:"max_channel_size_sat,omitempty" yaml:"max_channel_size_sat,omitempty" validate:"omitempty,gtefield=MinChannelSizeSat"`
	MinChannelSizeSat *uint64           `json:"min_channel_size_sat,omitempty" yaml:"min_channel_size_sat,omitempty"`
	ContactInfo       []ContactInfo     `json:"contact_info,omitempty" yaml:"contact_info,omitempty" validate:"dive"`
	CustomRecords     map[string]string `json:"custom_records,omitempty" yaml:"custom_records,omitempty"`
}

type ContactInfo struct {
	Type    string `json:"type" yaml:"type" validate:"required"`
	Value   string `json:"value" yaml:"value" validate:"required"`
	Note    string `json:"note,omitempty" yaml:"note,omitempty"`
	Primary bool   `json:"primary,omitempty" yaml:"primary,omitempty"`
}

func (n *NodeInfo) Validate() error {
	// Validate all fields with required tag
	if err := validate.Struct(n); err != nil {
		return err
	}

	// ensure at most one ContactInfo has Primary == true
	count := 0
	for _, c := range n.ContactInfo {
		if c.Primary {
			count++
			if count > 1 {
				return errors.New("only one contact info may be primary")
			}
		}
	}
	return nil
}

----------------------
----------------------
----------------------

