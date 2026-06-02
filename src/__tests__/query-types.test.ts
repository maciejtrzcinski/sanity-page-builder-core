import {describe, expectTypeOf, it} from 'vitest'

import type {PageBuilderBlockOf, PageBuilderBlocksOf} from '../index'

// Mirrors the shape of a Sanity typegen query result: nullable doc, nullable
// array, blocks each carrying a `_type`.
type Hero = {_type: 'hero'; _key: string; title: string | null}
type Faq = {_type: 'faq'; _key: string; items: string[] | null}
type PageDocQueryResult = {
  _id: string
  pageBuilder: Array<Hero | Faq> | null
} | null

describe('PageBuilderBlocksOf / PageBuilderBlockOf', () => {
  it('extracts the blocks array (incl. its null) from a nullable doc', () => {
    expectTypeOf<PageBuilderBlocksOf<PageDocQueryResult>>().toEqualTypeOf<Array<
      Hero | Faq
    > | null>()
  })

  it('extracts the non-null block union as the element type', () => {
    expectTypeOf<PageBuilderBlockOf<PageDocQueryResult>>().toEqualTypeOf<Hero | Faq>()
  })

  it('supports a custom field name', () => {
    type Doc = {sections: Array<Hero> | null} | null
    expectTypeOf<PageBuilderBlockOf<Doc, 'sections'>>().toEqualTypeOf<Hero>()
  })
})
