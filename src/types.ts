/** The minimal shape every page-builder block shares (a Sanity array member). */
export interface BlockLike {
  _type: string
  _key?: string
}

/**
 * The page-builder array type extracted from a GROQ query result (your typegen
 * output). Handles the document being nullable and the field name being
 * configurable (default `'pageBuilder'`).
 *
 * ```ts
 * import type {PageDocQueryResult} from '@/sanity.types'
 * type Blocks = PageBuilderBlocksOf<PageDocQueryResult>
 * ```
 */
export type PageBuilderBlocksOf<
  TQueryResult,
  TField extends string = 'pageBuilder',
> = TField extends keyof NonNullable<TQueryResult> ? NonNullable<TQueryResult>[TField] : never

/**
 * A single (non-null) page-builder block extracted from a GROQ query result —
 * the element type of {@link PageBuilderBlocksOf}. This is the union you pass as
 * `TBlock` to {@link createPageBuilder}.
 *
 * ```ts
 * type Block = PageBuilderBlockOf<PageDocQueryResult>
 * ```
 */
export type PageBuilderBlockOf<TQueryResult, TField extends string = 'pageBuilder'> =
  NonNullable<PageBuilderBlocksOf<TQueryResult, TField>> extends ReadonlyArray<infer TElement>
    ? NonNullable<TElement>
    : never

/**
 * Renders a single block of a known `_type` into your framework's node type.
 * `TNode` is generic so this package never depends on React (set it to
 * `ReactNode` in a React app, or anything else).
 */
export type BlockRenderer<TBlock extends BlockLike, TContext, TNode> = (
  block: TBlock,
  context: TContext,
) => TNode

/**
 * A complete map from each block `_type` in the `TBlock` union to its renderer.
 * Using a mapped type over `TBlock['_type']` makes the compiler enforce that
 * every block variant has exactly one correctly-typed renderer.
 */
export type RendererMap<TBlock extends BlockLike, TContext, TNode> = {
  [K in TBlock['_type']]: BlockRenderer<Extract<TBlock, {_type: K}>, TContext, TNode>
}
