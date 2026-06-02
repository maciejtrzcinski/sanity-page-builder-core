import {describe, expect, it} from 'vitest'

import {renderPageBuilderBlocks} from '../index'

type Block = {_type: string; _key?: string; sectionId?: string}

// A plain-object "node" so we can assert without React. renderBlock and wrap
// agree on this node type.
type Node = {tag: 'block' | 'wrap'; key?: string; id?: string; edit?: string; inner: string}

const renderBlock = (b: Block): Node | null =>
  b._type === 'skip' ? null : {tag: 'block', inner: `r:${b._type}`}

const wrap = (node: Node, info: {key?: string; id?: string; editAttr?: string}): Node => ({
  tag: 'wrap',
  key: info.key,
  id: info.id,
  edit: info.editAttr,
  inner: node.inner,
})

const render = (blocks: Array<Block | null>, opts: Record<string, unknown> = {}) =>
  renderPageBuilderBlocks<Block, undefined, Node>(blocks, undefined, {renderBlock, wrap, ...opts})

describe('renderPageBuilderBlocks', () => {
  it('renders each non-null block and threads the key', () => {
    const out = render([
      {_type: 'hero', _key: 'k1'},
      {_type: 'faq', _key: 'k2'},
    ])
    expect(out.map((n) => [n.key, n.inner])).toEqual([
      ['k1', 'r:hero'],
      ['k2', 'r:faq'],
    ])
  })

  it('skips null blocks and renderers that return null', () => {
    const out = render([{_type: 'hero', _key: 'k1'}, null, {_type: 'skip', _key: 'k2'}])
    expect(out).toHaveLength(1)
  })

  it('passes section anchor id from the configured field', () => {
    const [node] = render([{_type: 'hero', _key: 'k', sectionId: 'features'}])
    expect(node.id).toBe('features')
  })

  it('computes the edit attribute only when documentId + dataAttr are present', () => {
    const dataAttr = (p: {id: string; type: string; path: Array<string | number>}) =>
      `${p.id}:${p.type}:${p.path.join('.')}`

    const [withEdit] = render([{_type: 'hero', _key: 'k'}], {
      documentId: 'doc1',
      pathBase: 'pageBuilder',
      dataAttr,
    })
    expect(withEdit.edit).toBe('doc1:hero:pageBuilder.0')

    const [noEdit] = render([{_type: 'hero', _key: 'k'}], {dataAttr}) // no documentId
    expect(noEdit.edit).toBeUndefined()
  })

  it('returns [] for nullish blocks', () => {
    expect(render(null as unknown as Block[])).toEqual([])
  })
})
