/**
 * V10 stage-specific model routing contract.
 *
 * The user-facing model labels are authoritative. Runtime ids are resolved
 * from the live DSH model catalog so custom gateways can expose different ids.
 * Missing targets fail closed; there is deliberately no cross-model fallback.
 */

export const STAGE_MODEL_ROUTES = Object.freeze({
  'usvd-01-adaptation': Object.freeze({
    target: 'GLM 5.3 FlashX',
    providerHints: ['zai', 'zhipu', 'aihubmix'],
    ids: ['glm-5.3-flashx'],
    legacyIds: [],
    nameMarkers: ['glm', '5.3', 'flashx'],
  }),
  'usvd-02-story-architecture': Object.freeze({
    target: 'GLM 5.3',
    providerHints: ['zai', 'zhipu', 'aihubmix'],
    ids: ['glm-5.3'],
    legacyIds: [],
    nameMarkers: ['glm', '5.3'],
  }),
  'usvd-03-screenwriter': Object.freeze({
    target: 'GLM 5.3',
    providerHints: ['zai', 'zhipu', 'aihubmix'],
    ids: ['glm-5.3'],
    legacyIds: [],
    nameMarkers: ['glm', '5.3'],
  }),
  'usvd-04-review-continuity': Object.freeze({
    target: 'GLM 5.3',
    providerHints: ['zai', 'zhipu', 'aihubmix'],
    ids: ['glm-5.3'],
    legacyIds: [],
    nameMarkers: ['glm', '5.3'],
  }),
})

export function stageRouteFor(skill) {
  return STAGE_MODEL_ROUTES[skill]
}

export function resolveStageModel(catalog, skill) {
  const route = stageRouteFor(skill)
  if (route === undefined) return { kind: 'unmapped', skill }

  const target = normalize(route.target)
  const directIds = new Set(route.ids.map(normalize))
  const legacyIds = new Set(route.legacyIds.map(normalize))
  const matches = []

  for (const group of catalog?.groups ?? []) {
    for (const model of group?.models ?? []) {
      const id = typeof model?.id === 'string' ? model.id : ''
      if (id === '') continue
      const name = typeof model?.name === 'string' ? model.name : ''
      const normalizedId = normalize(id)
      const leafId = normalize(id.split('/').at(-1) ?? id)
      const normalizedName = normalize(name)
      let matchRank

      if (normalizedName === target) {
        matchRank = 0
      } else if (directIds.has(normalizedId) || directIds.has(leafId)) {
        matchRank = 1
      } else if (
        (legacyIds.has(normalizedId) || legacyIds.has(leafId))
        && route.nameMarkers.every(marker => normalizedName.includes(normalize(marker)))
      ) {
        // A shortened provider id such as claude-opus-5 is accepted only when
        // the live catalog display name proves it is the requested 5.5 route.
        matchRank = 2
      } else {
        continue
      }

      matches.push({
        provider: group.id,
        model: id,
        name: name || id,
        matchRank,
        providerRank: providerRank(group.id, route.providerHints),
      })
    }
  }

  if (matches.length === 0) {
    return {
      kind: 'unavailable',
      skill,
      target: route.target,
      reason: 'REQUIRED_MODEL_UNAVAILABLE',
    }
  }

  matches.sort((a, b) =>
    a.matchRank - b.matchRank
    || a.providerRank - b.providerRank
    || String(a.provider).localeCompare(String(b.provider))
    || a.model.localeCompare(b.model))

  const selected = matches[0]
  return {
    kind: 'resolved',
    skill,
    target: route.target,
    selected: {
      provider: selected.provider,
      model: selected.model,
      name: selected.name,
    },
  }
}

function providerRank(provider, hints) {
  const normalized = normalize(provider)
  const index = hints.map(normalize).indexOf(normalized)
  return index < 0 ? hints.length : index
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/gu, '-')
    .replace(/[^a-z0-9.-]+/gu, '')
}
