import { createHash, KeyObject, verify } from 'node:crypto'

const EVENT_SCHEMA = 'usvd-approval-event/v1'
const SNAPSHOT_SCHEMA = 'usvd-approval-snapshot/v1'
const DOMAIN = 'USVD_APPROVAL_EVENT_V1\0'
const digestPattern = /^[a-f0-9]{64}$/u
const recordFields = [
  'schema', 'project_id', 'artifact_id', 'revision', 'content_digest', 'scope',
  'actor', 'decision', 'event_id', 'key_id', 'state_version', 'previous_event_digest',
]
const refFields = ['project_id', 'artifact_id', 'revision', 'content_digest']

function digest(value) { return typeof value === 'string' && digestPattern.test(value) }
function fail(code) { throw new Error(code) }
function integer(value, minimum = 0) { return Number.isSafeInteger(value) && value >= minimum }
function text(value) { return typeof value === 'string' && value.trim().length > 0 }
function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value))
}
function exactKeys(value, fields, code) {
  if (!object(value) || Object.keys(value).length !== fields.length
    || !fields.every(field => Object.hasOwn(value, field))) fail(code)
}
function hash(value) { return createHash('sha256').update(value, 'utf8').digest('hex') }
function copy(value) { return JSON.parse(canonicalJson(value)) }

/** Versioned local encoding, not a claim of RFC 8785/JCS interoperability. */
export function canonicalJson(value) {
  const ancestors = new Set()
  function encode(current, depth) {
    if (depth > 100) fail('INVALID_JSON')
    if (current === null || typeof current === 'boolean') return JSON.stringify(current)
    if (typeof current === 'string') {
      if (!current.isWellFormed()) fail('INVALID_JSON')
      return JSON.stringify(current)
    }
    if (typeof current === 'number') {
      if (!Number.isFinite(current) || Object.is(current, -0)) fail('INVALID_JSON')
      return JSON.stringify(current)
    }
    if (typeof current !== 'object' || ancestors.has(current)) fail('INVALID_JSON')
    if (!Array.isArray(current) && !object(current)) fail('INVALID_JSON')
    const descriptors = Object.getOwnPropertyDescriptors(current)
    const ownKeys = Reflect.ownKeys(current)
    if (ownKeys.some(key => typeof key !== 'string'
      || !key.isWellFormed()
      || !Object.hasOwn(descriptors[key], 'value')
      || (!descriptors[key].enumerable && !(Array.isArray(current) && key === 'length')))) fail('INVALID_JSON')
    ancestors.add(current)
    let encoded
    if (Array.isArray(current)) {
      if (ownKeys.length !== current.length + 1) fail('INVALID_JSON')
      const values = []
      for (let index = 0; index < current.length; index += 1) {
        if (!Object.hasOwn(descriptors, String(index))) fail('INVALID_JSON')
        values.push(encode(descriptors[String(index)].value, depth + 1))
      }
      encoded = `[${values.join(',')}]`
    } else {
      encoded = `{${ownKeys.sort().map(key => `${JSON.stringify(key)}:${encode(descriptors[key].value, depth + 1)}`).join(',')}}`
    }
    ancestors.delete(current)
    return encoded
  }
  return encode(value, 0)
}

function validateArtifact(artifact) {
  // Validate JSON before examining properties so accessors cannot supply facts.
  canonicalJson(artifact)
  exactKeys(artifact, ['project_id', 'artifact_id', 'revision', 'content'], 'INVALID_ARTIFACT')
  if (!text(artifact.project_id) || !text(artifact.artifact_id)
    || !integer(artifact.revision, 1) || !object(artifact.content)) fail('INVALID_ARTIFACT')
}

export function artifactDigest(artifact) {
  validateArtifact(artifact)
  return hash(canonicalJson(artifact))
}
function artifactRef(artifact) {
  return {
    project_id: artifact.project_id, artifact_id: artifact.artifact_id,
    revision: artifact.revision, content_digest: artifactDigest(artifact),
  }
}
function validateRef(ref) {
  exactKeys(ref, refFields, 'INVALID_RECORD')
  if (!text(ref.project_id) || !text(ref.artifact_id) || !integer(ref.revision, 1)
    || !digest(ref.content_digest)) fail('INVALID_RECORD')
}
function validateRecord(record) {
  canonicalJson(record)
  const additional = record?.decision === 'revoke' ? ['target_event_id']
    : record?.decision === 'story_change' ? ['next_artifact'] : []
  exactKeys(record, [...recordFields, ...additional], 'INVALID_RECORD')
  if (record.schema !== EVENT_SCHEMA || !['approve', 'reject', 'revoke', 'story_change'].includes(record.decision)
    || !['project_id', 'artifact_id', 'scope', 'actor', 'event_id', 'key_id'].every(field => text(record[field]))
    || !integer(record.revision, 1) || !integer(record.state_version)
    || !digest(record.content_digest)
    || !(record.previous_event_digest === null || digest(record.previous_event_digest))) fail('INVALID_RECORD')
  if (record.decision === 'revoke' && !text(record.target_event_id)) fail('INVALID_RECORD')
  if (record.decision === 'story_change') validateRef(record.next_artifact)
}

/** External signers may use these bytes. No signing/private-key operation is exported. */
export function approvalSigningBytes(record) {
  validateRecord(record)
  return Buffer.from(DOMAIN + canonicalJson(record), 'utf8')
}

function capturePublicKeys(keys) {
  if (!(keys instanceof Map) || keys.size === 0) fail('PUBLIC_KEY_REQUIRED')
  const captured = new Map()
  for (const [id, key] of keys) {
    if (!text(id) || !(key instanceof KeyObject) || key.type !== 'public') fail('PUBLIC_KEY_REQUIRED')
    if (key.asymmetricKeyType !== 'ed25519') fail('ED25519_REQUIRED')
    captured.set(id, key)
  }
  return captured
}
function verifiedEnvelope(input, publicKeys) {
  const envelope = copy(input)
  exactKeys(envelope, ['record', 'signature'], 'INVALID_ENVELOPE')
  const bytes = approvalSigningBytes(envelope.record)
  const key = publicKeys.get(envelope.record.key_id)
  if (!key) fail('UNTRUSTED_KEY')
  // Ed25519 signatures are exactly 64 bytes; require one canonical wire encoding.
  if (typeof envelope.signature !== 'string' || !/^[A-Za-z0-9_-]{86}$/u.test(envelope.signature)) fail('INVALID_SIGNATURE')
  const signature = Buffer.from(envelope.signature, 'base64url')
  if (signature.length !== 64 || signature.toString('base64url') !== envelope.signature
    || !verify(null, bytes, key, signature)) fail('INVALID_SIGNATURE')
  return envelope
}

/**
 * Synthetic, process-local protocol model. All authority is an injected key map.
 * The actor is a signed assertion; there is NO authenticated human boundary here.
 */
export function createProtocol({ artifact, scope, trustedPublicKeys }) {
  validateArtifact(artifact)
  if (!text(scope)) fail('INVALID_SCOPE')
  const publicKeys = capturePublicKeys(trustedPublicKeys)
  const initialArtifact = copy(artifact)
  let currentArtifact = copy(artifact)
  let version = 0
  let previousEventDigest = null
  let protocolStatus = 'NO_APPROVAL'
  let approvalEventId = null
  const seenEvents = new Set()
  const events = []

  function context() {
    return { ...artifactRef(currentArtifact), scope, state_version: version, previous_event_digest: previousEventDigest }
  }

  function evaluate({ artifact: supplied, scope: suppliedScope }) {
    validateArtifact(supplied)
    let status = protocolStatus
    if (suppliedScope !== scope || supplied.project_id !== currentArtifact.project_id
      || supplied.artifact_id !== currentArtifact.artifact_id) status = 'BINDING_MISMATCH'
    else if (artifactDigest(supplied) !== artifactDigest(currentArtifact)) status = 'STALE'
    return {
      protocol_status: status, state_version: version,
      approval_event_id: status === 'APPROVED_RECORD' ? approvalEventId : null,
      human_identity: 'UNVERIFIED', production_gate: 'BLOCKED',
    }
  }

  function apply(input, { expectedVersion, nextArtifact } = {}) {
    if (!integer(expectedVersion) || expectedVersion !== version || version === Number.MAX_SAFE_INTEGER) fail('VERSION_CONFLICT')
    const envelope = verifiedEnvelope(input, publicKeys)
    const record = envelope.record
    if (record.state_version !== version) fail('VERSION_CONFLICT')
    if (seenEvents.has(record.event_id)) fail('EVENT_REPLAY')
    if (record.previous_event_digest !== previousEventDigest) fail('CHAIN_MISMATCH')
    const current = context()
    if (![...refFields, 'scope'].every(field => record[field] === current[field])) fail('BINDING_MISMATCH')

    let replacement
    if (record.decision === 'story_change') {
      try {
        validateArtifact(nextArtifact)
        const nextRef = artifactRef(nextArtifact)
        if (nextRef.project_id !== current.project_id || nextRef.artifact_id !== current.artifact_id
          || nextRef.revision <= current.revision
          || !refFields.every(field => nextRef[field] === record.next_artifact[field])) fail('INVALID_CHANGE')
        replacement = copy(nextArtifact)
      } catch { fail('INVALID_CHANGE') }
    } else if (nextArtifact !== undefined) fail('INVALID_CHANGE')
    if (record.decision === 'revoke'
      && (protocolStatus !== 'APPROVED_RECORD' || record.target_event_id !== approvalEventId)) fail('REVOCATION_TARGET_MISMATCH')

    // No mutation occurs before all signature, binding, chain, CAS and change checks.
    if (record.decision === 'approve') {
      protocolStatus = 'APPROVED_RECORD'; approvalEventId = record.event_id
    } else {
      protocolStatus = { reject: 'REJECTED', revoke: 'REVOKED', story_change: 'STALE' }[record.decision]
      approvalEventId = null
    }
    if (replacement) currentArtifact = replacement
    seenEvents.add(record.event_id)
    events.push({ envelope, ...(replacement ? { nextArtifact: replacement } : {}) })
    previousEventDigest = hash(canonicalJson(envelope))
    version += 1
    return evaluate({ artifact: currentArtifact, scope })
  }

  function snapshot() {
    const serialized = canonicalJson({ schema: SNAPSHOT_SCHEMA, initialArtifact, scope, events })
    return { serialized, checkpoint: { state_version: version, snapshot_digest: hash(serialized) } }
  }

  return Object.freeze({ context, apply, evaluate, snapshot, currentArtifact: () => copy(currentArtifact) })
}

/** Checkpoint must come from trusted caller storage, not from the same untrusted snapshot. */
export function restoreProtocol(serialized, { trustedPublicKeys, expectedCheckpoint } = {}) {
  if (!expectedCheckpoint) fail('CHECKPOINT_REQUIRED')
  exactKeys(expectedCheckpoint, ['state_version', 'snapshot_digest'], 'CHECKPOINT_REQUIRED')
  if (!integer(expectedCheckpoint.state_version) || !digest(expectedCheckpoint.snapshot_digest)) fail('CHECKPOINT_REQUIRED')
  if (typeof serialized !== 'string' || hash(serialized) !== expectedCheckpoint.snapshot_digest) fail('CHECKPOINT_MISMATCH')
  let snapshot
  try { snapshot = JSON.parse(serialized) } catch { fail('INVALID_SNAPSHOT') }
  // Only accept our canonical snapshot wire format; rejects duplicate keys as well.
  if (canonicalJson(snapshot) !== serialized) fail('INVALID_SNAPSHOT')
  exactKeys(snapshot, ['schema', 'initialArtifact', 'scope', 'events'], 'INVALID_SNAPSHOT')
  if (snapshot.schema !== SNAPSHOT_SCHEMA || !Array.isArray(snapshot.events)
    || snapshot.events.length !== expectedCheckpoint.state_version) fail('CHECKPOINT_MISMATCH')
  const instance = createProtocol({ artifact: snapshot.initialArtifact, scope: snapshot.scope, trustedPublicKeys })
  for (const event of snapshot.events) {
    exactKeys(event, event?.envelope?.record?.decision === 'story_change' ? ['envelope', 'nextArtifact'] : ['envelope'], 'INVALID_SNAPSHOT')
    instance.apply(event.envelope, { expectedVersion: instance.context().state_version, nextArtifact: event.nextArtifact })
  }
  return instance
}
