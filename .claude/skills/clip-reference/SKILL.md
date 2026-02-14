---
name: clip-reference
description: Work with CLIP protocol implementation, validate Lightning signatures, modify event handling, or change trust semantics. Reference the Go implementation for correctness.
---

# CLIP Protocol Go Reference Code

This document contains the authoritative Go reference implementation for the CLIP (Common Lightning-node Information Payload) protocol. The TypeScript implementation in this project must **strictly mirror** the behavior of this code.

**Source**: [github.com/feelancer21/clip](https://github.com/feelancer21/clip)

---

## Table of Contents

- [Protocol Overview](#protocol-overview)
- [event.go — Event Structure, Validation, Signing](#eventgo--event-structure-validation-signing)
- [client.go — Fetch Logic, Store Sync](#clientgo--fetch-logic-store-sync)
- [store.go — Trust Semantics, Announcement Handling](#storego--trust-semantics-announcement-handling)
- [payloads.go — Node Info Validation](#payloadsgo--node-info-validation)

---

## Protocol Overview

### Abstract

CLIP enables Lightning node operators to cryptographically link their node identity to a Nostr pubkey and publish verifiable node metadata (contact information, channel policies, custom records) over Nostr.

CLIP uses Nostr addressable events of kind `38171`, differentiated by a `k` tag into distinct message types. A Lightning node signature provides the trust anchor that binds a Lightning node identity to a Nostr pubkey.

### Event Format

All CLIP events use a single Nostr event kind:

```jsonc
{
  "kind": 38171,
  "pubkey": "<nostr-pubkey-hex>",
  "created_at": <timestamp>,
  "tags": [
    ["d", "<identifier>"],
    ["k", "<clip-kind>"],
    // additional tags depending on kind
  ],
  "content": "<json-payload-or-empty>",
  "sig": "<nostr-signature>"
}
```

As addressable events, relays only store the most recent version for each unique combination of `d` tag and author pubkey, automatically replacing older versions.

#### Tag Definitions

| Tag   | Required | Description |
|-------|----------|-------------|
| `d`   | yes      | Unique identifier. Format depends on the CLIP kind (see Message Types). |
| `k`   | yes      | CLIP message kind as a string (`"0"`, `"1"`, ...). |
| `sig` | kind 0   | Lightning node signature. zbase32-encoded ECDSA signature over the event hash computed _without_ the `sig` tag (see Signature Verification). Present only on Node Announcements. |

#### Validation Rules

In addition to standard Nostr event validation (NIP-01), clients MUST enforce:

- `content` MUST NOT exceed 1,048,576 bytes (1 MB).
- For Kind 1 events, the `k` tag value MUST match the kind encoded in the `d` tag.

Clients MAY reject events from Lightning nodes with no on-chain channel capacity as a spam protection measure.

### Message Types

#### Kind 0 -- Node Announcement

A Node Announcement is a trust anchor that links a Lightning node's public key to a Nostr pubkey. It MUST be signed by both the Lightning node's identity key (via the `sig` tag) and a Nostr key (standard Nostr event signature).

**`d` tag:** `<lightning_pubkey>`

The `d` tag contains the compressed public key of the Lightning node (66-character hex string).

**`content`:** empty (`""` or `"{}"`)

**Additional tags:**

| Tag   | Description |
|-------|-------------|
| `sig` | zbase32-encoded Lightning signature over the event hash (see Signature Verification). |

**Example:**

```json
{
  "kind": 38171,
  "pubkey": "a1b2c3d4e5f6...",
  "created_at": 1700000000,
  "tags": [
    ["d", "03abc123def456..."],
    ["k", "0"],
    ["sig", "ryz1bnx5..."]
  ],
  "content": "{}",
  "sig": "nostr-signature..."
}
```

#### Kind 1 -- Node Info

A Node Info event contains metadata about a Lightning node. It only requires a Nostr signature and MUST be signed by the Nostr key that was bound in the most recent Node Announcement for that Lightning node.

**`d` tag:** `<kind>:<lightning_pubkey>:<network>`

Example: `1:03abc123def456...:mainnet`

Valid networks: `mainnet`, `testnet`, `testnet4`, `signet`, `simnet`, `regtest`.

**`content`:** JSON object with the following schema:

| Field                | Type              | Description |
|----------------------|-------------------|-------------|
| `about`              | string            | Human-readable description of the node. |
| `max_channel_size_sat` | integer         | Maximum channel size the operator is willing to accept (satoshis). |
| `min_channel_size_sat` | integer         | Minimum channel size the operator requires (satoshis). |
| `contact_info`       | array of objects  | Contact methods (see below). At most one entry MAY have `primary: true`. |
| `custom_records`     | object            | Arbitrary string key-value pairs for additional information. |

All fields are optional.

If both `max_channel_size_sat` and `min_channel_size_sat` are present, `max_channel_size_sat` MUST be greater than or equal to `min_channel_size_sat`.

**Contact Info object:**

| Field     | Type    | Required | Description |
|-----------|---------|----------|-------------|
| `type`    | string  | yes      | Contact type (e.g., `"nostr"`, `"email"`, `"telegram"`). |
| `value`   | string  | yes      | Contact address or handle. |
| `note`    | string  | no       | Additional context about this contact method. |
| `primary` | boolean | no       | Whether this is the preferred contact method. At most one contact MAY be primary. |

**Example:**

```json
{
  "kind": 38171,
  "pubkey": "a1b2c3d4e5f6...",
  "created_at": 1700000100,
  "tags": [
    ["d", "1:03abc123def456...:mainnet"],
    ["k", "1"]
  ],
  "content": "{\"about\":\"High-uptime routing node.\",\"max_channel_size_sat\":16777215,\"min_channel_size_sat\":100000,\"contact_info\":[{\"type\":\"nostr\",\"value\":\"npub1...\",\"primary\":true},{\"type\":\"email\",\"value\":\"node@example.com\"}],\"custom_records\":{\"acceptance_policy\":\"Accepting channels from reliable nodes.\"}}",
  "sig": "nostr-signature..."
}
```

### Signature Verification

Node Announcements (Kind 0) require a Lightning node signature in the `sig` tag. This signature binds the Lightning node identity to the Nostr event.

#### Signed Message

The signed message is the **event hash** of the event _without_ the `sig` tag. This hash is the Nostr event ID, i.e., the hex-encoded SHA-256 of the canonical JSON serialization `[0, pubkey, created_at, kind, tags_without_sig, content]`.

Specifically, the `sig` tag is excluded from the tags array before computing the event ID. This means the signature covers the Nostr pubkey, the Lightning pubkey (in the `d` tag), the timestamp, and all other event content.

#### Signature Format

The signature follows the LND `SignMessage` RPC format:

1. The message bytes are prefixed with `"Lightning Signed Message:"` (no null terminator).
2. The prefixed message is double-SHA-256 hashed: `SHA256(SHA256("Lightning Signed Message:" || message))`.
3. The result is signed with the node's identity key using ECDSA (secp256k1), producing a compact recoverable signature.
4. The signature is encoded as zbase32.

#### Verification Procedure

To verify a Node Announcement:

1. Extract the `sig` tag value and decode from zbase32.
2. Compute the event hash (event ID) over the event _without_ the `sig` tag.
3. Prefix the hash with `"Lightning Signed Message:"` and compute the double-SHA-256.
4. Recover the public key from the compact ECDSA signature.
5. Compare the recovered public key (compressed, hex-encoded) against the `d` tag value.
6. If they match, the signature is valid.

### Trust Model

The trust model ensures that only the legitimate node operator can publish information for a given Lightning node.

#### Establishing Trust

A Node Announcement (Kind 0) establishes which Nostr pubkey is authorized to publish events for a Lightning node. The Lightning signature proves the announcement was created by (or authorized by) the node operator.

#### Key Rotation (nsec Compromise)

If a node operator's Nostr key is compromised, they can publish a new Node Announcement with a different Nostr pubkey. Clients MUST handle this as follows:

1. Among all Node Announcements for a given Lightning pubkey, only the one with the most recent `created_at` is considered valid.
2. If the new announcement uses a different Nostr pubkey than the previous one, **all prior events** for that node MUST be discarded.
3. Only events signed by the Nostr pubkey from the most recent announcement are accepted.

Note: Since Node Announcements are addressable events with different Nostr author pubkeys, relays will store both the old and new announcements. Clients are responsible for selecting the most recent one.

#### Event Acceptance

Before accepting a Kind 1 event, clients MUST:

1. Fetch all Node Announcements for the corresponding Lightning pubkey to establish the trust anchor.
2. Determine the most recent Node Announcement (by `created_at`).
3. Reject the event if its Nostr pubkey does not match the most recent announcement's Nostr pubkey.


---

## event.go — Event Structure, Validation, Signing

```go
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
```

---

## client.go — Fetch Logic, Store Sync

```go
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
```

---

## store.go — Trust Semantics, Announcement Handling

```go
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
```

---

## payloads.go — Node Info Validation

```go
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
```

---

## CombinedSigner — Signing Order

The signing order is **strict and must be mirrored exactly**:

1. The event must already be finalized (`d` and `k` tags set)
2. If the event is a Node Announcement (`k=0`): Lightning signature (`sig` tag) added **first**
3. Nostr signature added **last**, signing the final event **including** the `sig` tag

```go
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

## Lightning Message Signing

LND, CLN, and Eclair use the **same message signing scheme**. Verification must strictly implement the Go logic (no heuristics, no fallbacks):

- `signedMsgPrefix`: `"Lightning Signed Message:"`
- Hash: `doubleHashB(prefix + message)`
- Recovery: `ecdsa.RecoverCompact(signature, hash)`
- Verification: recovered pubkey must match the Lightning pubkey in the `d` tag
