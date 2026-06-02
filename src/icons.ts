import {findMissingRenderers, findOrphanRenderers} from './parity'

// zero-width space (200B), ZWNJ (200C), ZWJ (200D), variation selector-16 (FE0F), BOM (FEFF)
const INVISIBLE_CHAR_CODES = [0x200b, 0x200c, 0x200d, 0xfe0f, 0xfeff]
const INVISIBLE_CHARS = new RegExp(
  INVISIBLE_CHAR_CODES.map((code) => String.fromCharCode(code)).join('|'),
  'g',
)

/** Default name cleanup: strip zero-width / variation-selector chars and trim. */
export function sanitizeIconName(value: string): string {
  return value.replace(INVISIBLE_CHARS, '').trim()
}

export interface IconMapOptions<TIcon> {
  /** name → icon (a component, URL, anything — `TIcon` is generic, no React dep). */
  icons: Record<string, TIcon>
  /** Returned when the name is missing/unknown (unless `strict`). */
  fallback?: TIcon
  /** Throw on an unknown name instead of returning the fallback. */
  strict?: boolean
  /** Override name normalization. @default {@link sanitizeIconName} */
  sanitize?: (name: string) => string
}

export interface IconMap<TIcon> {
  readonly icons: Record<string, TIcon>
  readonly names: readonly string[]
  has(name: string): boolean
  /** Resolve a (possibly dirty/empty/unknown) name to an icon, fallback, or throw. */
  resolve(name?: string | null): TIcon | undefined
}

/**
 * Build a name → icon resolver with the same registration discipline as the
 * page builder: one map, a fallback, optional strictness, and parity helpers to
 * keep it in sync with your Studio's icon option list.
 *
 * ```ts
 * const icons = createIconMap({icons: SECTION_ICON_COMPONENTS, fallback: Circle})
 * icons.resolve(block.icon?.name) // → component (or Circle)
 * ```
 */
export function createIconMap<TIcon>(options: IconMapOptions<TIcon>): IconMap<TIcon> {
  const {icons, fallback, strict = false, sanitize = sanitizeIconName} = options
  const names = Object.freeze(Object.keys(icons).sort())

  return {
    icons,
    names,
    has: (name) => name in icons,
    resolve(name) {
      const raw = name ? sanitize(name) : ''
      if (raw && raw in icons) return icons[raw]
      if (strict) {
        throw new Error(`[page-builder] No icon registered for name: "${name ?? ''}"`)
      }
      return fallback
    },
  }
}

/** Icon names declared somewhere (e.g. Studio `ICON_OPTIONS`) with no entry in the map. */
export function findMissingIcons(
  declaredNames: Iterable<string>,
  icons: Record<string, unknown>,
): string[] {
  return findMissingRenderers(declaredNames, icons)
}

/** Icon-map entries not present in the declared list (orphans / typos). */
export function findOrphanIcons(
  declaredNames: Iterable<string>,
  icons: Record<string, unknown>,
): string[] {
  return findOrphanRenderers(declaredNames, icons)
}

/** Throw if the icon map and the declared icon names have drifted. */
export function assertIconMapIntegrity(input: {
  icons: Record<string, unknown>
  declaredNames: Iterable<string>
}): void {
  const declared = [...input.declaredNames]
  const missing = findMissingIcons(declared, input.icons)
  const orphan = findOrphanIcons(declared, input.icons)
  const problems: string[] = []
  if (missing.length) problems.push(`No icon for declared name(s): ${missing.join(', ')}`)
  if (orphan.length) problems.push(`Icon map has unused name(s): ${orphan.join(', ')}`)
  if (problems.length > 0) {
    throw new Error(`[page-builder] Icon map integrity check failed:\n- ${problems.join('\n- ')}`)
  }
}
