import type {BlockLike} from './types'

export interface BlockWrapInfo<TBlock> {
  block: TBlock
  index: number
  /** Stable key for the rendered node (the block's `_key`). */
  key: string | undefined
  /** Section anchor id, if the block carries one (see `sectionIdField`). */
  id?: string
  /** Visual-editing attribute value, present only when editing is enabled. */
  editAttr?: string
}

export interface RenderPageBuilderBlocksOptions<TBlock extends BlockLike, TContext, TNode> {
  /** Render one block to a node (e.g. your `createPageBuilder(...).renderBlock`). */
  renderBlock: (block: TBlock, context: TContext) => TNode | null
  /**
   * Wrap a rendered (non-null) node. This is where your framework's element
   * creation lives — apply `info.key`/`info.id`/`info.editAttr`. Keeping it a
   * callback is what lets this package stay free of React/JSX.
   */
  wrap: (node: TNode, info: BlockWrapInfo<TBlock>) => TNode
  /** Document `_id`; when set (with `dataAttr`), an `editAttr` is computed per block. */
  documentId?: string
  /** Array path base for the edit attribute. @default 'pageBuilder' */
  pathBase?: string
  /** Block field holding a section anchor id. @default 'sectionId' */
  sectionIdField?: string
  /** Builds the visual-editing attribute string (e.g. next-sanity `createDataAttribute`). */
  dataAttr?: (params: {id: string; type: string; path: Array<string | number>}) => string
}

/**
 * The page-builder render loop + visual-editing convention, framework-agnostic.
 * It filters empty blocks, skips renderers that return null, and computes
 * `key` / section-anchor `id` / the edit attribute for each block — then hands
 * the node to your `wrap` callback for actual element creation.
 *
 * ```tsx
 * {renderPageBuilderBlocks(blocks, context, {
 *   renderBlock,
 *   documentId, pathBase, dataAttr: (p) => dataAttr(p).toString(),
 *   wrap: (content, {key, id, editAttr}) =>
 *     editAttr ? <div key={key} id={id} data-sanity={editAttr}>{content}</div>
 *       : id ? <div key={key} id={id}>{content}</div>
 *       : <Fragment key={key}>{content}</Fragment>,
 * })}
 * ```
 */
export function renderPageBuilderBlocks<TBlock extends BlockLike, TContext, TNode>(
  blocks: ReadonlyArray<TBlock | null | undefined> | null | undefined,
  context: TContext,
  options: RenderPageBuilderBlocksOptions<TBlock, TContext, TNode>,
): TNode[] {
  if (!blocks) return []

  const {
    renderBlock,
    wrap,
    documentId,
    pathBase = 'pageBuilder',
    sectionIdField = 'sectionId',
    dataAttr,
  } = options

  const out: TNode[] = []

  blocks.forEach((block, index) => {
    if (!block) return
    const node = renderBlock(block, context)
    if (node === null || node === undefined) return

    const idValue = (block as Record<string, unknown>)[sectionIdField]
    const id = typeof idValue === 'string' && idValue.trim() ? idValue : undefined
    const editAttr =
      documentId && dataAttr
        ? dataAttr({id: documentId, type: block._type, path: [pathBase, index]})
        : undefined

    out.push(wrap(node, {block, index, key: block._key, id, editAttr}))
  })

  return out
}
