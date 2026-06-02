/**
 * Set-comparison helpers for keeping a renderer map in sync with the source of
 * truth for which block types exist (e.g. a Sanity section registry) and with
 * the GROQ projection that fetches them. The *loading* of those sources stays in
 * your app (file paths / query strings are project-specific); these helpers do
 * the generic diffing so your parity test is a few assertions.
 */

/** Registered types that have no entry in `renderers`. */
export function findMissingRenderers(
  registeredTypes: Iterable<string>,
  renderers: Record<string, unknown>,
): string[] {
  return [...registeredTypes].filter((type) => !(type in renderers))
}

/** Renderer keys that are not in `registeredTypes` (orphans / typos / removed). */
export function findOrphanRenderers(
  registeredTypes: Iterable<string>,
  renderers: Record<string, unknown>,
): string[] {
  const registered = new Set(registeredTypes)
  return Object.keys(renderers).filter((type) => !registered.has(type))
}

/**
 * Types with no `_type == "<type>"` conditional present in a GROQ query string —
 * catches sections that render but were never added to the projection.
 */
export function findTypesMissingFromQuery(types: Iterable<string>, query: string): string[] {
  return [...types].filter((type) => !query.includes(`_type == "${type}"`))
}

export interface IntegrityInput {
  /** The renderer map (object keyed by `_type`). */
  renderers: Record<string, unknown>
  /** Source-of-truth list of section types (e.g. from your Sanity registry). */
  registeredTypes: Iterable<string>
  /** Optional GROQ projection string to also check for `_type == "…"` coverage. */
  query?: string
}

/**
 * One guardrail that throws an aggregated error if the renderer map, the
 * registered section types, and (optionally) the GROQ projection have drifted —
 * collapsing the individual parity checks into a single enforced gate. Run it in
 * a test, a build step, or at module load.
 */
export function assertPageBuilderIntegrity(input: IntegrityInput): void {
  const registered = [...input.registeredTypes]
  const missingRenderers = findMissingRenderers(registered, input.renderers)
  const orphanRenderers = findOrphanRenderers(registered, input.renderers)
  const missingFromQuery = input.query ? findTypesMissingFromQuery(registered, input.query) : []

  const problems: string[] = []
  if (missingRenderers.length) problems.push(`No renderer for: ${missingRenderers.join(', ')}`)
  if (orphanRenderers.length)
    problems.push(`Renderer not in registry: ${orphanRenderers.join(', ')}`)
  if (missingFromQuery.length)
    problems.push(`Missing from GROQ projection: ${missingFromQuery.join(', ')}`)

  if (problems.length > 0) {
    throw new Error(`[page-builder] Integrity check failed:\n- ${problems.join('\n- ')}`)
  }
}
