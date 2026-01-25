# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
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
- “Work in progress” header copy for the top panel.

### Changed
- Default relay list set to `wss://relay.damus.io` and `wss://nos.lol`.
- Relay list shown only under Settings tab (removed from Home).
- Feed window for node info expanded to 1 year for development.
- Sidebar title updated to “Lightning Node Identity” with smaller font size.
- Removed multi-account “Add another account” action.

### Fixed
- Removed `X` icon references causing runtime errors.
- Updated nostr-tools signature verification to use `verifyEvent`.
- Corrected feed rendering when no data is loaded.
- Resolved missing event queries by removing `#k` relay filtering and filtering locally.
- Stabilized sidebar height on desktop.

## [Phase 2 Completed]
- Read-only CLIP feed implemented with Go-reference trust logic.
- Verification enforces required tags, event ID, signatures, content size, and network allow-list.
- Announcements fetched with long window; node info fetched with feed window.

## [Phase 1 Completed]
- NIP-07 login and relay configuration foundations delivered.
- Sidebar layout and navigation scaffolded.
