# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Phase 3 operator profiles (Nostr user profiles) - COMPLETE:
  - `useOperatorProfile` hook for querying and deriving operator data from CLIP events.
  - OperatorProfile page component displaying:
    - Nostr identity (npub, Kind 0 metadata: name, picture, about).
    - Operated Lightning nodes derived from valid Node Announcements.
    - Node Info payloads grouped by Lightning node and network.
    - Operator timeline showing all CLIP events (k=0, k=1) authored by the operator.
  - ProfilePage wrapper for NIP-19 routing (npub1..., nprofile1...).
  - Navigation from feed cards to operator profiles.
  - Back button navigation from profiles.
  - Clickable feed cards leading to operator profiles.
  - External link to mempool.space for each Lightning node.
- Branding & UI enhancements:
  - Orange star favicon (SVG) in browser tab.
  - Orange star icon in sidebar (desktop and mobile).
  - Responsive branding across all views.
- Profile routing improvements:
  - Canonical routes: `/profile/:nip19` and `/p/:nip19` (both NIP-19 identifiers only).
  - Proper NIP-19 decoding for npub1... and nprofile1... formats.
  - Invalid identifiers show 404 NotFound state.
  - No hex pubkeys in URLs (clean, idiomatic Nostr URLs).
- Relay debugging & diagnostics:
  - RelayTest diagnostic page at `/debug/relays` for testing relay connectivity.
  - Per-relay connection testing with individual timeouts (5 seconds each).
  - Relay test shows response times, event counts, and per-relay status.
  - Enhanced console logging in NostrProvider and useClipFeed.
  - Timeout handling for relay queries (10 seconds default).
- Browser compatibility:
  - crypto.randomUUID polyfill for browsers without native support.
  - RFC 4122 v4 UUID generator implementation.
- Phase 1-2 features:
  - Phase 1 shell with sidebar navigation and mobile hamburger menu.
  - NIP-07 login dialog integration and active profile display in the sidebar.
  - Local relay management panel (add/remove relays) via app config storage.
  - Sidebar icons for Home, Search, Publish, DMs, and Settings.
  - Active profile summary with logout-only submenu.
  - Dark-themed account submenu styling for consistency in dark mode.
  - CLIP feed pipeline (read-only):
    - Event parsing and validation for kind 38171 with `k=0` and `k=1`.
    - Store enforcing trust semantics (latest announcement, pubkey rotation, node info gating).
    - Feed rendering of validated events only.
  - Network badges with distinct colors (mainnet/testnet/testnet4/signet).
  - Relative timestamps with hover tooltips showing exact timestamps.
  - "Work in progress" header copy for the top panel.

### Changed
- Feed cards now clickable, navigating to operator profiles via NIP-19 URLs.
- Profile routing refactored to use NIP-19 identifiers (npub1..., nprofile1...) instead of hex pubkeys.
- OperatorProfile component now accepts pubkey as prop instead of from URL params.
- Enhanced relay query timeouts and error handling.
- NostrProvider and useClipFeed now include detailed debug logging.
- RelayTest uses direct NRelay1 connections for more reliable diagnostics.
- Removed legacy /operator/:hex redirect route (simplified routing).
- Default relay list set to `wss://relay.damus.io` and `wss://nos.lol`.
- Relay list shown only under Settings tab (removed from Home).
- Feed window for node info expanded to 1 year for development.
- Sidebar title updated to "Lightning Node Identity" with smaller font size.
- Removed multi-account "Add another account" action.

### Fixed
- Fixed crypto.randomUUID polyfill for browser compatibility (nostrify library dependency).
- Fixed relay test hanging indefinitely by adding per-relay timeouts.
- Fixed relay test infinite "Testing..." state with proper Promise.race() timeouts.
- Fixed feedEvents array safety check to prevent undefined errors.
- Removed `X` icon references causing runtime errors.
- Updated nostr-tools signature verification to use `verifyEvent`.
- Corrected feed rendering when no data is loaded.
- Resolved missing event queries by removing `#k` relay filtering and filtering locally.
- Stabilized sidebar height on desktop.

## [Phase 3 Completed]

### Core Features
- ✅ Operator profile pages showing Nostr identity and operated Lightning nodes.
- ✅ Profiles derive node ownership exclusively from valid CLIP Node Announcements.
- ✅ Node Info payloads render in context of operator profiles.
- ✅ Operator timelines display CLIP events authored by each operator.
- ✅ Navigation from feed to operator profiles fully functional.

### Routing & URLs
- ✅ Canonical NIP-19 routing: `/profile/npub1...` and `/p/npub1...`
- ✅ NIP-19 identifier support for npub1 and nprofile1 formats.
- ✅ No hex pubkeys in URLs (clean, idiomatic Nostr conventions).
- ✅ Proper error handling for invalid NIP-19 identifiers.

### UI & Branding
- ✅ Orange star favicon in browser tab.
- ✅ Orange star icon in sidebars (desktop and mobile).
- ✅ Responsive design across all profile views.

### Reliability & Debugging
- ✅ Relay diagnostic page at `/debug/relays` for testing connectivity.
- ✅ Per-relay connection testing with timeout handling.
- ✅ Enhanced console logging for debugging relay and feed issues.
- ✅ crypto.randomUUID polyfill for browser compatibility.
- ✅ Proper error messages and timeout handling.

## [Phase 2 Completed]
- Read-only CLIP feed implemented with Go-reference trust logic.
- Verification enforces required tags, event ID, signatures, content size, and network allow-list.
- Announcements fetched with long window; node info fetched with feed window.

## [Phase 1 Completed]
- NIP-07 login and relay configuration foundations delivered.
- Sidebar layout and navigation scaffolded.
