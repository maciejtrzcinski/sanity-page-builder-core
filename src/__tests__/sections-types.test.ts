import {describe, expect, expectTypeOf, it} from 'vitest'

import {createPageBuilderFromSections, createSectionFactory} from '../index'
import type {AnySectionModule, BlockLike} from '../index'

// Type-level tests: `pnpm type-check` (tsc) fails if an `@ts-expect-error`
// below stops erroring or an `expectTypeOf` assertion stops holding.

type Block = {_type: 'hero'; title: string} | {_type: 'faq'; items: string[]} | {_type: 'cta'}
type Ctx = {locale: string}

const defineSection = createSectionFactory<Block, Ctx, string>()
const hero = defineSection({type: 'hero', render: (b) => b.title})
const faq = defineSection({type: 'faq', render: (b) => String(b.items.length)})
const cta = defineSection({type: 'cta', render: () => 'cta'})

describe('createPageBuilderFromSections exhaustiveness', () => {
  it('infers the block union, context, and node type from the sections', () => {
    const pb = createPageBuilderFromSections([hero, faq, cta])
    expectTypeOf(pb.renderers).toHaveProperty('faq')
    expectTypeOf(pb.renderBlock).parameter(1).toEqualTypeOf<Ctx>()
    expectTypeOf(pb.renderBlock).returns.toEqualTypeOf<string | null>()
  })

  it('is a compile error to leave out a section for a block type', () => {
    // @ts-expect-error -- no section for "faq" or "cta"
    expect(() => createPageBuilderFromSections([hero])).not.toThrow()
    // @ts-expect-error -- no section for "cta"
    expect(() => createPageBuilderFromSections([hero, faq])).not.toThrow()
  })

  it('still checks sections that were spread into new objects', () => {
    const heroWithQuery = {...hero, query: 'title'}
    expect(() => createPageBuilderFromSections([heroWithQuery, faq, cta])).not.toThrow()
    // @ts-expect-error -- no section for "faq" or "cta"
    expect(() => createPageBuilderFromSections([heroWithQuery])).not.toThrow()
  })

  it('accepts a non-tuple array of sections', () => {
    const sections = [hero, faq, cta]
    expect(createPageBuilderFromSections(sections).rendererTypes).toEqual(['cta', 'faq', 'hero'])
  })

  it('skips the check for loosely-typed sections', () => {
    const loose: AnySectionModule<Ctx, string>[] = [hero]
    const pb = createPageBuilderFromSections(loose)
    expectTypeOf(pb.renderers).toEqualTypeOf<
      Record<string, (block: BlockLike, context: Ctx) => string>
    >()
    expectTypeOf(pb.renderBlock).parameter(1).toEqualTypeOf<Ctx>()
  })

  it('types onMissing with the inferred context and node', () => {
    createPageBuilderFromSections([hero, faq, cta], {
      onMissing: (type, _block, context) => {
        expectTypeOf(context).toEqualTypeOf<Ctx>()
        return `missing:${type}`
      },
    })
  })
})
