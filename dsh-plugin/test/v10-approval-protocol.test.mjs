import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import test from 'node:test'

import * as protocol from '../../core/usvd-v10/approval-protocol/index.mjs'

const { publicKey, privateKey } = generateKeyPairSync('ed25519')
const attacker = generateKeyPairSync('ed25519')
const keys = new Map([['test-key-1', publicKey]])
const artifact = {
  project_id: 'synthetic-project', artifact_id: 'story-1', revision: 1,
  content: { title: 'Synthetic only', ending: 'The lost note is returned.' },
}
const scope = 'screenwrite:season-1'
const clone = value => JSON.parse(JSON.stringify(value))
const setup = () => protocol.createProtocol({ artifact, scope, trustedPublicKeys: keys })
function recordFor(instance, overrides = {}) {
  return {
    schema: 'usvd-approval-event/v1', ...instance.context(),
    event_id: 'event-1', key_id: 'test-key-1', actor: 'synthetic-actor',
    decision: 'approve', ...overrides,
  }
}
function signed(record, signingKey = privateKey) {
  return { record, signature: sign(null, protocol.approvalSigningBytes(record), signingKey).toString('base64url') }
}
function apply(instance, overrides = {}, options = {}) {
  return instance.apply(signed(recordFor(instance, overrides)), {
    expectedVersion: instance.context().state_version, ...options,
  })
}
const status = instance => instance.evaluate({ artifact: instance.currentArtifact(), scope }).protocol_status

{
  test('canonical bytes preserve text and array order and ignore object key insertion order', () => {
    assert.equal(protocol.canonicalJson({ z: ['中文', 'a'], a: 1 }), '{"a":1,"z":["中文","a"]}')
    assert.equal(protocol.artifactDigest(artifact), protocol.artifactDigest({
      content: { ending: 'The lost note is returned.', title: 'Synthetic only' },
      revision: 1, artifact_id: 'story-1', project_id: 'synthetic-project',
    }))
    assert.notEqual(protocol.artifactDigest(artifact), protocol.artifactDigest({ ...artifact, content: { ...artifact.content, title: 'Synthetic only ' } }))
    for (const value of [undefined, NaN, Infinity, -0, new Date(), { bad: undefined }, [1, , 2], { toJSON() { return {} } }]) {
      assert.throws(() => protocol.canonicalJson(value), /INVALID_JSON/)
    }
    const cyclic = {}; cyclic.self = cyclic
    assert.throws(() => protocol.canonicalJson(cyclic), /INVALID_JSON/)
  })

  test('an exact signed approval is a protocol result, never proof of a human or a production gate', () => {
    const instance = setup()
    assert.equal(status(instance), 'NO_APPROVAL')
    apply(instance)
    assert.deepEqual(instance.evaluate({ artifact, scope }), {
      protocol_status: 'APPROVED_RECORD', state_version: 1, approval_event_id: 'event-1',
      human_identity: 'UNVERIFIED', production_gate: 'BLOCKED',
    })
  })

  test('forged signatures and signed-record mutations leave state untouched', () => {
    const instance = setup()
    assert.throws(() => instance.apply(signed(recordFor(instance), attacker.privateKey), { expectedVersion: 0 }), /INVALID_SIGNATURE/)
    for (const field of ['project_id', 'artifact_id', 'revision', 'content_digest', 'scope', 'actor', 'decision', 'event_id', 'key_id']) {
      const envelope = signed(recordFor(instance))
      envelope.record[field] = field === 'revision' ? 2 : field === 'decision' ? 'reject' : `tampered-${field}`
      assert.throws(() => instance.apply(envelope, { expectedVersion: 0 }))
      assert.equal(instance.context().state_version, 0)
    }
  })

  test('trusted signature alone cannot authorize the wrong project, artifact, revision, digest, or scope', () => {
    const instance = setup()
    for (const override of [
      { project_id: 'another-project' }, { artifact_id: 'another-artifact' }, { revision: 2 },
      { content_digest: 'f'.repeat(64) }, { scope: 'screenwrite:another-season' },
    ]) assert.throws(() => instance.apply(signed(recordFor(instance, override)), { expectedVersion: 0 }), /BINDING_MISMATCH/)
    assert.equal(status(instance), 'NO_APPROVAL')
  })

  test('records cannot select their own public key or omit required identity and binding fields', () => {
    const instance = setup()
    const selfTrusted = signed(recordFor(instance, { key_id: 'attacker-key' }), attacker.privateKey)
    selfTrusted.public_key = attacker.publicKey.export({ type: 'spki', format: 'pem' })
    assert.throws(() => instance.apply(selfTrusted, { expectedVersion: 0 }), /INVALID_ENVELOPE/)
    delete selfTrusted.public_key
    assert.throws(() => instance.apply(selfTrusted, { expectedVersion: 0 }), /UNTRUSTED_KEY/)
    for (const field of ['project_id', 'artifact_id', 'revision', 'content_digest', 'scope', 'actor', 'decision', 'event_id', 'key_id']) {
      const incomplete = recordFor(instance); delete incomplete[field]
      assert.throws(() => protocol.approvalSigningBytes(incomplete), /INVALID_RECORD/)
    }
    assert.throws(() => protocol.createProtocol({ artifact, scope, trustedPublicKeys: new Map([['private', privateKey]]) }), /PUBLIC_KEY_REQUIRED/)
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 })
    assert.throws(() => protocol.createProtocol({ artifact, scope, trustedPublicKeys: new Map([['rsa', rsa.publicKey]]) }), /ED25519_REQUIRED/)
  })

  test('caller mutation of inputs, outputs, or key map cannot rewrite accepted state', () => {
    const supplied = clone(artifact)
    const suppliedKeys = new Map(keys)
    const instance = protocol.createProtocol({ artifact: supplied, scope, trustedPublicKeys: suppliedKeys })
    supplied.content.ending = 'Changed without approval'
    suppliedKeys.set('test-key-1', attacker.publicKey)
    const envelope = signed(recordFor(instance))
    instance.apply(envelope, { expectedVersion: 0 })
    envelope.record.decision = 'reject'
    instance.currentArtifact().content.ending = 'Changed via getter'
    assert.equal(status(instance), 'APPROVED_RECORD')
    assert.equal(instance.currentArtifact().content.ending, 'The lost note is returned.')
  })

  test('replayed event IDs and concurrent stale expected versions cannot apply twice', () => {
    const instance = setup()
    const first = signed(recordFor(instance))
    const concurrent = signed(recordFor(instance, { event_id: 'event-concurrent', decision: 'reject' }))
    instance.apply(first, { expectedVersion: 0 })
    assert.throws(() => instance.apply(concurrent, { expectedVersion: 0 }), /VERSION_CONFLICT/)
    assert.throws(() => instance.apply(first, { expectedVersion: 1 }), /VERSION_CONFLICT/)
    assert.throws(() => apply(instance, { event_id: 'event-1' }), /EVENT_REPLAY/)
    assert.equal(status(instance), 'APPROVED_RECORD')
    assert.equal(instance.context().state_version, 1)
  })

  test('CAS expectedVersion is mandatory and signed chain predecessor must match', () => {
    const instance = setup()
    const envelope = signed(recordFor(instance))
    assert.throws(() => instance.apply(envelope), /VERSION_CONFLICT/)
    assert.throws(() => instance.apply(envelope, { expectedVersion: 1 }), /VERSION_CONFLICT/)
    apply(instance)
    assert.throws(() => apply(instance, { event_id: 'event-2', previous_event_digest: '0'.repeat(64) }), /CHAIN_MISMATCH/)
    assert.equal(instance.context().state_version, 1)
  })

  test('signed revocation invalidates approval and does not allow unsigned clearing or replay', () => {
    const instance = setup()
    apply(instance)
    const revoke = recordFor(instance, { event_id: 'event-2', decision: 'revoke', target_event_id: 'event-1' })
    assert.throws(() => instance.apply({ record: revoke, signature: 'not-a-signature' }, { expectedVersion: 1 }), /INVALID_SIGNATURE/)
    assert.equal(status(instance), 'APPROVED_RECORD')
    instance.apply(signed(revoke), { expectedVersion: 1 })
    assert.equal(status(instance), 'REVOKED')
    assert.throws(() => apply(instance, { event_id: 'event-3', decision: 'revoke', target_event_id: 'missing' }), /REVOCATION_TARGET_MISMATCH/)
    apply(instance, { event_id: 'event-4' })
    assert.equal(status(instance), 'APPROVED_RECORD')
  })

  test('signed rejection cannot be treated as an approval', () => {
    const instance = setup()
    apply(instance, { decision: 'reject' })
    assert.equal(status(instance), 'REJECTED')
    assert.equal(instance.evaluate({ artifact, scope }).production_gate, 'BLOCKED')
  })

  test('SCR advances the story revision and invalidates old approval and in-flight version', () => {
    const instance = setup()
    apply(instance)
    const approvedVersion = 1
    const updated = { ...clone(artifact), revision: 2, content: { ...artifact.content, ending: 'The note stays lost.' } }
    const next_artifact = { project_id: updated.project_id, artifact_id: updated.artifact_id, revision: 2, content_digest: protocol.artifactDigest(updated) }
    apply(instance, { event_id: 'event-scr', decision: 'story_change', next_artifact }, { nextArtifact: updated })
    assert.equal(status(instance), 'STALE')
    assert.equal(instance.evaluate({ artifact, scope }).protocol_status, 'STALE')
    assert.throws(() => instance.apply(signed(recordFor(instance, { event_id: 'after-scr' })), { expectedVersion: approvedVersion }), /VERSION_CONFLICT/)
    assert.throws(() => apply(instance, { event_id: 'old-digest', revision: 1, content_digest: protocol.artifactDigest(artifact) }), /BINDING_MISMATCH/)
    apply(instance, { event_id: 'new-approval' })
    assert.equal(status(instance), 'APPROVED_RECORD')
    assert.equal(instance.evaluate({ artifact, scope }).protocol_status, 'STALE')
  })

  test('SCR rejects missing, mismatched, cross-project, and non-increasing replacements atomically', () => {
    const instance = setup()
    apply(instance)
    const valid = { ...clone(artifact), revision: 2 }
    const ref = { project_id: artifact.project_id, artifact_id: artifact.artifact_id, revision: 2, content_digest: protocol.artifactDigest(valid) }
    const envelope = signed(recordFor(instance, { event_id: 'scr', decision: 'story_change', next_artifact: ref }))
    for (const nextArtifact of [undefined, { ...valid, project_id: 'other' }, artifact, { ...valid, content: { altered: true } }]) {
      assert.throws(() => instance.apply(envelope, { expectedVersion: 1, nextArtifact }), /INVALID_CHANGE/)
      assert.equal(status(instance), 'APPROVED_RECORD')
      assert.equal(instance.context().state_version, 1)
    }
  })

  test('evaluation denies wrong scope and content mutation without relying on a caller status label', () => {
    const instance = setup(); apply(instance)
    assert.equal(instance.evaluate({ artifact, scope: 'another-scope' }).protocol_status, 'BINDING_MISMATCH')
    const mutated = { ...artifact, content: { ending: 'A different ending', status: 'APPROVED' } }
    assert.equal(instance.evaluate({ artifact: mutated, scope }).protocol_status, 'STALE')
  })

  test('serialized snapshots replay verified events and preserve revocation without shipping keys', () => {
    const instance = setup(); apply(instance)
    apply(instance, { event_id: 'revoked', decision: 'revoke', target_event_id: 'event-1' })
    const snapshot = instance.snapshot()
    assert.equal(snapshot.checkpoint.state_version, 2)
    assert.equal(snapshot.checkpoint.snapshot_digest, createHash('sha256').update(snapshot.serialized).digest('hex'))
    assert.doesNotMatch(snapshot.serialized, /PRIVATE KEY|PUBLIC KEY|trustedPublicKeys/)
    const restored = protocol.restoreProtocol(snapshot.serialized, { trustedPublicKeys: keys, expectedCheckpoint: snapshot.checkpoint })
    assert.equal(status(restored), 'REVOKED')
    assert.deepEqual(restored.context(), instance.context())
    assert.throws(() => apply(restored, { event_id: 'event-1' }), /EVENT_REPLAY/)
  })

  test('snapshot recovery rejects tampering, truncation, wrong trusted keys, and absent external checkpoints', () => {
    const instance = setup(); apply(instance)
    const old = instance.snapshot()
    apply(instance, { event_id: 'revoked', decision: 'revoke', target_event_id: 'event-1' })
    const latest = instance.snapshot()
    assert.throws(() => protocol.restoreProtocol(old.serialized, { trustedPublicKeys: keys, expectedCheckpoint: latest.checkpoint }), /CHECKPOINT_MISMATCH/)
    assert.throws(() => protocol.restoreProtocol(latest.serialized, { trustedPublicKeys: keys }), /CHECKPOINT_REQUIRED/)
    const changed = JSON.parse(latest.serialized); changed.events[0].envelope.record.actor = 'forged-actor'
    const serialized = protocol.canonicalJson(changed)
    const forgedCheckpoint = { state_version: 2, snapshot_digest: createHash('sha256').update(serialized).digest('hex') }
    assert.throws(() => protocol.restoreProtocol(serialized, { trustedPublicKeys: keys, expectedCheckpoint: forgedCheckpoint }), /INVALID_SIGNATURE/)
    assert.throws(() => protocol.restoreProtocol(latest.serialized, { trustedPublicKeys: new Map([['test-key-1', attacker.publicKey]]), expectedCheckpoint: latest.checkpoint }), /INVALID_SIGNATURE/)
    assert.throws(() => protocol.restoreProtocol('{invalid', { trustedPublicKeys: keys, expectedCheckpoint: latest.checkpoint }))
  })

  test('snapshot roundtrip after SCR requires fresh approval of the current revision', () => {
    const instance = setup(); apply(instance)
    const updated = { ...clone(artifact), revision: 2 }
    apply(instance, { event_id: 'scr', decision: 'story_change', next_artifact: {
      project_id: updated.project_id, artifact_id: updated.artifact_id, revision: 2,
      content_digest: protocol.artifactDigest(updated),
    } }, { nextArtifact: updated })
    const snapshot = instance.snapshot()
    const restored = protocol.restoreProtocol(snapshot.serialized, { trustedPublicKeys: keys, expectedCheckpoint: snapshot.checkpoint })
    assert.equal(status(restored), 'STALE')
    assert.deepEqual(restored.currentArtifact(), updated)
    apply(restored, { event_id: 'fresh' })
    assert.equal(status(restored), 'APPROVED_RECORD')
  })

  test('digest fields reject JSON arrays that coerce to a valid SHA-256 string', () => {
    const instance = setup()
    for (const override of [
      { content_digest: ['a'.repeat(64)] },
      { previous_event_digest: ['a'.repeat(64)] },
      { decision: 'story_change', next_artifact: {
        project_id: artifact.project_id, artifact_id: artifact.artifact_id,
        revision: 2, content_digest: ['a'.repeat(64)],
      } },
    ]) assert.throws(() => protocol.approvalSigningBytes(recordFor(instance, override)), /INVALID_RECORD/)
  })

  test('snapshot recovery rejects duplicate JSON keys and injected derived approval status', () => {
    const instance = setup(); apply(instance)
    const original = instance.snapshot()
    const duplicate = original.serialized.replace('"schema":"usvd-approval-snapshot/v1"',
      '"schema":"usvd-approval-snapshot/v1","schema":"usvd-approval-snapshot/v1"')
    const injected = JSON.parse(original.serialized); injected.protocol_status = 'APPROVED_RECORD'
    for (const serialized of [duplicate, protocol.canonicalJson(injected)]) {
      assert.throws(() => protocol.restoreProtocol(serialized, { trustedPublicKeys: keys, expectedCheckpoint: {
        state_version: 1, snapshot_digest: createHash('sha256').update(serialized).digest('hex'),
      } }), /INVALID_SNAPSHOT/)
    }
  })
}
