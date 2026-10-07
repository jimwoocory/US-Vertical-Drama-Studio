# V10 signed approval protocol POC

Status: **local synthetic-data proof of concept**, task V10-01C. This module is preparation for V10-01B; it does not unblock the production Human Approval Gate.

**A cryptographically valid signed record is not proof that a real human approved anything. 签名记录有效 ≠ 真实人批准。** A signature proves possession of a configured signing key and integrity of the signed statement. The `actor` field is only that signer's assertion. There is no identity provider, authenticated user channel, DSH hook, NAS integration, network service, production database, or signing service here. Every evaluation returns `human_identity: UNVERIFIED` and `production_gate: BLOCKED`, even when its protocol status is `APPROVED_RECORD`.

Only the tests generate private keys, in memory, using Node crypto. No keys, credentials, user stories, or production approvals are stored in this directory. The module only accepts externally supplied Ed25519 **public KeyObjects** in a `Map<key_id, publicKey>`; it captures that map at creation. It neither reads keys from files nor trusts a public key included in an incoming envelope. Do not promote a test key to production trust.

## Data contract

The synthetic artifact is a plain JSON object with exactly:

```json
{
  "project_id": "synthetic-project",
  "artifact_id": "story-1",
  "revision": 1,
  "content": {
    "title": "Synthetic only",
    "ending": "The lost note is returned."
  }
}
```

`revision` is a positive safe integer. The content is an object; this is a protocol fixture, **not** the complete V10 Story Package schema or a semantic story validator. Its SHA-256 digest includes identity, revision, and all content. Changes to story text, whitespace inside text, or content fields change that digest.

A signed envelope has exactly `record` and `signature`. Its record has these required fields:

| Field | Meaning |
| --- | --- |
| `schema` | `usvd-approval-event/v1` |
| `project_id`, `artifact_id`, `revision`, `content_digest` | Exact current artifact identity and SHA-256 digest |
| `scope` | Exact nonempty operation scope, such as `screenwrite:season-1`; no implicit wildcards |
| `actor` | Signer-asserted actor ID; no authentication or human classification inferred |
| `decision` | `approve`, `reject`, `revoke`, or `story_change` |
| `event_id` | Unique within this protocol instance, preserved across restoration |
| `key_id` | Selects only a key in the externally injected trusted map |
| `state_version` | Expected nonnegative safe-integer protocol version before applying the event |
| `previous_event_digest` | SHA-256 of the preceding canonical signed envelope; `null` only at genesis |

A `revoke` record additionally requires `target_event_id`, matching the currently effective approved event. A `story_change` record additionally requires `next_artifact`, containing the next project's/artifact's `project_id`, `artifact_id`, strictly increasing `revision`, and `content_digest`. The caller supplies the replacement synthetic artifact separately; its content must match this signed reference. Other extra record or envelope fields are rejected.

Each accepted event consumes a version. Reusing an event ID fails. `approve` sets `APPROVED_RECORD`; `reject` sets `REJECTED`; `revoke` sets `REVOKED`; `story_change` replaces the artifact and sets `STALE`, with no inherited approval. A new, distinct, correctly signed approval may approve the current revision after revocation or change. This does not make the production gate available.

A Story Change here models acceptance of a replacement synthetic revision, not the full SCR proposal/impact-review workflow or downstream dependency DAG. `STALE` exposes the invalidation that a future caller must propagate. This module does not create, read or modify scripts, assets, Ledger, or downstream artifacts.

## Encoding and signature

`canonicalJson` defines a local versioned encoding: object keys sorted with JavaScript string ordering; arrays retain order; UTF-8 strings retain their contents; no Unicode normalization. It rejects malformed Unicode, cycles, accessors, symbols, undefined/functions/bigints, non-plain objects, sparse arrays, non-finite numbers and negative zero. Nesting is limited to 100. Do not describe this implementation as RFC 8785/JCS-compatible; a cross-language signer must implement these exact rules and test vectors before interoperability is claimed.

Artifact digest: SHA-256 over canonical artifact JSON. Signing bytes: UTF-8 `USVD_APPROVAL_EVENT_V1` followed by a NUL byte and canonical record JSON. Signature: Ed25519, represented as canonical unpadded base64url of exactly 64 signature bytes. The domain prefix separates approval statements from unrelated signed payloads. The previous-event digest covers the complete signed envelope.

Record/JSON validation applies before signature verification and transitions. Every signature, identity/scope binding, predecessor, version, event ID, revocation target and replacement artifact is checked before changing state. Invalid transitions throw a stable error code and leave the instance unchanged. Input/output objects cannot be mutated to rewrite captured state.

## API

`index.mjs` uses only Node built-ins and the repository's Node >=24 baseline:

- `canonicalJson(value)` → canonical string.
- `artifactDigest(artifact)` → lowercase SHA-256 hex string.
- `approvalSigningBytes(record)` → bytes for an **external** signer. This does not sign anything.
- `createProtocol({ artifact, scope, trustedPublicKeys })` → process-local instance.
- `restoreProtocol(serialized, { trustedPublicKeys, expectedCheckpoint })` → instance reconstructed by verifying and replaying every event.

Instance methods:

- `context()` gives the current artifact binding, scope, state version, and predecessor digest for a proposed record. Reading it does not reserve a version.
- `apply(envelope, { expectedVersion, nextArtifact? })` verifies and applies one event. The caller's expected version and the signed version must both match the current state. A failed comparison throws `VERSION_CONFLICT`.
- `evaluate({ artifact, scope })` compares the supplied artifact/scope to the current state and returns protocol status plus the unconditional identity/production limitations. Wrong project/artifact/scope returns `BINDING_MISMATCH`; changed revision/content returns `STALE`.
- `currentArtifact()` returns a copy, not a mutable reference to state.
- `snapshot()` returns `{ serialized, checkpoint: { state_version, snapshot_digest } }`. It serializes initial artifact, scope and verified event history; it does not serialize private/public keys or a trusted derived status.

The compare-and-swap is synchronous **within one in-memory instance**. It does not provide database transactions, multi-process locking, or protection against concurrent writes from two independently restored instances. A future service must persist events and version updates atomically and enforce the same compare-and-swap at commit time; a stale result from `evaluate()` is not a durable execution permit.

## Snapshot recovery and trust limits

`restoreProtocol` requires a separately supplied expected checkpoint. It checks the exact serialized digest and event count, accepts only canonical snapshot JSON (including rejecting duplicate JSON keys), and replays events with the supplied public keys. Replay rechecks signatures, state versions, chain order, duplicate IDs, scopes and artifact references; it does not accept a serialized `APPROVED` status as evidence.

The expected checkpoint must come from external trusted, rollback-resistant storage. If an attacker replaces **both** snapshot and expected checkpoint with an older valid pair, this POC cannot detect rollback. Hashes are not authentication. No such trusted storage is implemented here. The caller must also trust the initial project/artifact/scope and configured key map, and verify checkpoint-to-project association when selecting a snapshot.

All configured keys have equal authority over the instance. There is no per-key role/actor ACL, certificate validation, key expiry/rotation/revocation system or trusted wall clock. Artifact approval revocation is tested; signer-key lifecycle is a separate deployment concern. Deleting a verification key prevents restoration of its history rather than silently trusting it.

Signed actor claims, valid event signatures, restored state, and protocol approval must not be converted into a claim of authenticated human approval. DSH slash/tool coverage, protected submission, user-origin identity, key custody, filesystem permissions, network reachability, operational audit and the target NAS runtime remain V10-01B verification work.

## Verification

From the repository root:

```sh
node --test dsh-plugin/test/v10-approval-protocol.test.mjs
node scripts/check-v10-v9-isolation.mjs
node scripts/sync-v9-distributions.mjs --check
```

Tests use only a synthetic story and ephemeral test keys. They exercise real Ed25519 signatures, including wrong signer, mutation, unknown/self-supplied keys, wrong project/artifact/revision/digest/scope, missing fields, illegal digest types, input mutation, duplicate events, version conflicts, predecessor mismatch, signed rejection/revocation, SCR invalidation, serialization recovery, truncation, duplicate JSON keys and injected derived status. They do not execute DSH, contact an identity provider, access NAS or prove that any human clicked approval.

Implementation was test-first: the initial behavior tests failed against the unimplemented API; an additional negative digest-type case then reproduced array-to-string coercion and passed after strict string validation was added. Existing V9 source and generated trees are unchanged. Full repository baseline failures are tracked separately in the project task board; this local POC does not fix them.
