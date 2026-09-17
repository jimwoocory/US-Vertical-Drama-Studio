/**
 * P1 browser panel compatibility boundary.
 *
 * DSH does not expose a version service to this plugin's declared injection
 * surface. Package peer resolution is therefore the hard install-time
 * boundary. Do not probe undeclared context properties here: Cordis correctly
 * rejects those reads before the plugin can load.
 */
export const P1_DSH_VERSION = '0.1.5-rc.1'

export function assertP1Compatibility(context) {
  if (context?.slots === undefined || typeof context.slots.inject !== 'function' || typeof context.slots.register !== 'function') {
    throw new Error(`US Vertical Drama P1 Workbench requires the DSH ${P1_DSH_VERSION} slot service. P0 skills remain available without this optional browser panel.`)
  }
}
