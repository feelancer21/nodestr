# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Phase 3 operator profiles (Nostr user profiles):
  - `useOperatorProfile` hook for querying and deriving operator data from CLIP events.
  - OperatorProfile page component displaying:
    - Nostr identity (npub, Kind 0 metadata: name, picture, about).
    - Operated Lightning nodes derived from valid Node Announcements.
    - Node Info payloads grouped by Lightning node and network.
    - Operator timeline showing all CLIP events (k=0, k=1) authored by the operator.
  - Navigation from feed cards to operator profiles.
  - Back button navigation from profiles.
  - Clickable feed cards leading to operator profiles.
  - External link to mempool.space for each Lightning node.
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
- Feed cards now clickable, navigating to operator profiles.
- Fixed undefined feedEvents.length check on home page.
- Default relay list set to `wss://relay.damus.io` and `wss://nos.lol`.
- Relay list shown only under Settings tab (removed from Home).
- Feed window for node info expanded to 1 year for development.
- Sidebar title updated to "Lightning Node Identity" with smaller font size.
- Removed multi-account "Add another account" action.

### Fixed
- Removed `X` icon references causing runtime errors.
- Updated nostr-tools signature verification to use `verifyEvent`.
- Corrected feed rendering when no data is loaded.
- Resolved missing event queries by removing `#k` relay filtering and filtering locally.
- Stabilized sidebar height on desktop.
- Fixed feedEvents array safety check to prevent undefined errors.

## [Phase 3 Completed]
- Operator profile pages implemented showing Nostr identity and operated Lightning nodes.
- Profiles derive node ownership exclusively from valid CLIP Node Announcements.
- Node Info payloads render in context of operator profiles.
- Operator timelines display CLIP events authored by each operator.
- Navigation from feed to operator profiles fully functional.

## [Phase 2 Completed]
- Read-only CLIP feed implemented with Go-reference trust logic.
- Verification enforces required tags, event ID, signatures, content size, and network allow-list.
- Announcements fetched with long window; node info fetched with feed window.

## [Phase 1 Completed]
- NIP-07 login and relay configuration foundations delivered.
- Sidebar layout and navigation scaffolded.
