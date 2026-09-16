/**
 * P1 browser panel compatibility boundary.
 *
 * DSH does not expose a stable version field to every browser extension point,
 * so package peer resolution is the hard install-time boundary. This guard
 * rejects a version whenever the host exposes one, and otherwise only uses the
 * 0.1.5-rc.1 slot API that the package declares as its exact peer.
 */
export const P1_DSH_VERSION = '0.1.5-rc.1'

export function assertP1Compatibility(context) {
  const declared = context?.dshVersion ?? context?.version ?? context?.runtimeVersion
  if (declared !== undefined && declared !== P1_DSH_VERSION) {
    throw new Error(`US Vertical Drama P1 Workbench requires DeepSeek Harness ${P1_DSH_VERSION}; detected ${String(declared)}. Keep P0 installed and launch P1 with the pinned command in README.`)
  }
  if (context?.slots === undefined || typeof context.slots.inject !== 'function' || typeof context.slots.register !== 'function') {
    throw new Error(`US Vertical Drama P1 Workbench requires the DSH ${P1_DSH_VERSION} slot service. P0 skills remain available without this optional browser panel.`)
  }
}
