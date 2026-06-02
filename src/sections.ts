import {createPageBuilder, type PageBuilder} from './createPageBuilder'
import type {BlockLike, BlockRenderer} from './types'

/**
 * A self-contained section: its `_type`, how to render it, and (optionally) its
 * GROQ projection fragment — all in one place, so they can't drift apart.
 */
export interface SectionModule<
  TBlock extends BlockLike,
  TContext,
  TNode,
  K extends TBlock['_type'],
> {
  type: K
  /** Renderer for this exact block variant (block is narrowed to `K`). */
  render: BlockRenderer<Extract<TBlock, {_type: K}>, TContext, TNode>
  /**
   * Optional GROQ projection body fetched for this section, e.g. `title, subtitle`.
   * Combined into one projection by {@link createPageBuilderFromSections}.
   */
  query?: string
}

/** Loosely-typed section, used for collections (per-section safety is at `defineSection`). */
export interface AnySectionModule<TContext, TNode> {
  type: string
  render: BlockRenderer<never, TContext, TNode>
  query?: string
}

export interface SectionPageBuilder<TBlock extends BlockLike, TContext, TNode> extends PageBuilder<
  TBlock,
  TContext,
  TNode
> {
  /** The section modules it was built from. */
  readonly sections: ReadonlyArray<AnySectionModule<TContext, TNode>>
  /** `_type` → GROQ projection body, for sections that declared a `query`. */
  readonly queryByType: Readonly<Record<string, string>>
  /**
   * Combined GROQ projection: one `_type == "x" => { … }` conditional per section
   * that declared a `query`, joined with commas. Drop into your pageBuilder field.
   */
  readonly query: string
}

/**
 * Create a `defineSection` bound to your block union, context, and node type.
 * Call once, then declare each section with it — `render`'s block argument is
 * narrowed to the section's `type`.
 *
 * ```ts
 * const defineSection = createSectionFactory<PageBuilderBlock, RenderContext, ReactNode>()
 * export const hero = defineSection({
 *   type: 'heroSection',
 *   query: `title, subtitle`,
 *   render: (block, ctx) => <Hero title={block.title} />, // block is heroSection
 * })
 * ```
 */
export function createSectionFactory<TBlock extends BlockLike, TContext, TNode>() {
  return function defineSection<K extends TBlock['_type']>(
    section: SectionModule<TBlock, TContext, TNode, K>,
  ): SectionModule<TBlock, TContext, TNode, K> {
    return section
  }
}

/**
 * Assemble a page builder from section modules. Builds the renderer map and the
 * combined GROQ projection, and throws on a duplicate `_type` (forcing one module
 * per section).
 */
export function createPageBuilderFromSections<TBlock extends BlockLike, TContext, TNode>(
  sections: ReadonlyArray<AnySectionModule<TContext, TNode>>,
  options: {
    strict?: boolean
    onMissing?: (type: string, block: BlockLike, context: TContext) => TNode | null
  } = {},
): SectionPageBuilder<TBlock, TContext, TNode> {
  const renderers: Record<string, BlockRenderer<never, TContext, TNode>> = {}
  const queryByType: Record<string, string> = {}
  const duplicates: string[] = []

  for (const section of sections) {
    if (section.type in renderers) duplicates.push(section.type)
    renderers[section.type] = section.render
    if (section.query) queryByType[section.type] = section.query
  }

  if (duplicates.length > 0) {
    throw new Error(
      `[page-builder] Duplicate section module(s) for type(s): ${[...new Set(duplicates)].join(', ')}`,
    )
  }

  const base = createPageBuilder<TBlock, TContext, TNode>({
    // The per-section render fns were type-checked at `defineSection`; the
    // collection is intentionally loose, so assert the assembled map here.
    renderers: renderers as never,
    strict: options.strict,
    onMissing: options.onMissing,
  })

  const query = Object.entries(queryByType)
    .map(([type, body]) => `_type == "${type}" => { ${body} }`)
    .join(',\n')

  return {...base, sections, queryByType, query}
}
