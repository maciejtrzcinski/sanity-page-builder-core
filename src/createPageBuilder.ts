import type {BlockLike, BlockRenderer, RendererMap} from './types'

export interface CreatePageBuilderOptions<TBlock extends BlockLike, TContext, TNode> {
  /** Map of block `_type` → renderer. Must cover every variant of `TBlock`. */
  renderers: RendererMap<TBlock, TContext, TNode>
  /**
   * Throw on a block whose `_type` has no renderer instead of skipping it.
   * Forces every block reaching the renderer to be registered. Takes precedence
   * over `onMissing`.
   */
  strict?: boolean
  /**
   * Called when a block's `_type` has no renderer (and `strict` is off). Defaults
   * to warning in dev (non-production) and returning `null`.
   */
  onMissing?: (type: string, block: BlockLike, context: TContext) => TNode | null
}

export interface PageBuilder<TBlock extends BlockLike, TContext, TNode> {
  /** The renderer map you passed in (re-exposed for parity tests etc.). */
  readonly renderers: RendererMap<TBlock, TContext, TNode>
  /** Sorted list of registered block `_type`s. */
  readonly rendererTypes: readonly string[]
  /** Whether a renderer exists for the given `_type`. */
  hasRenderer(type: string): boolean
  /**
   * Render one block. Accepts unknown blocks (e.g. a newly-added type not yet in
   * `TBlock`) and routes them through `onMissing`.
   */
  renderBlock(block: TBlock | BlockLike, context: TContext): TNode | null
}

function defaultOnMissing(type: string): null {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(`[page-builder] No renderer registered for block type: ${type}`)
  }
  return null
}

/**
 * Create a typed page-builder dispatcher from a renderer map. The compiler
 * enforces a renderer for every `TBlock` variant; at runtime, unknown `_type`s
 * fall through to `onMissing`.
 *
 * ```ts
 * const pb = createPageBuilder<MyBlock, MyContext, ReactNode>({renderers: {...}})
 * pb.renderBlock(block, context)
 * ```
 */
export function createPageBuilder<TBlock extends BlockLike, TContext = unknown, TNode = unknown>(
  options: CreatePageBuilderOptions<TBlock, TContext, TNode>,
): PageBuilder<TBlock, TContext, TNode> {
  const {renderers, onMissing, strict = false} = options
  const map = renderers as unknown as Record<
    string,
    BlockRenderer<BlockLike, TContext, TNode> | undefined
  >
  const rendererTypes = Object.freeze(Object.keys(renderers).sort())

  return {
    renderers,
    rendererTypes,
    hasRenderer: (type) => type in renderers,
    renderBlock(block, context) {
      const renderer = map[block._type]
      if (!renderer) {
        if (strict) {
          throw new Error(
            `[page-builder] No renderer registered for block type: "${block._type}". ` +
              `Register it (or pass strict:false to skip unknown blocks).`,
          )
        }
        return onMissing ? onMissing(block._type, block, context) : defaultOnMissing(block._type)
      }
      return renderer(block, context)
    },
  }
}
