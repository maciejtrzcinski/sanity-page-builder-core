import {describe, expect, it} from 'vitest'

import {
  assertIconMapIntegrity,
  assertPageBuilderIntegrity,
  createIconMap,
  createPageBuilder,
  createPageBuilderFromSections,
  createSectionFactory,
} from '../index'

type Block = {_type: 'hero'; title: string} | {_type: 'faq'; items: string[]}
type Ctx = {locale: string}

describe('strict mode', () => {
  const pb = createPageBuilder<Block, Ctx, string>({
    strict: true,
    renderers: {hero: (b) => b.title, faq: (b) => String(b.items.length)},
  })

  it('throws on an unregistered block type', () => {
    expect(() => pb.renderBlock({_type: 'mystery'}, {locale: 'en'})).toThrowError(
      /No renderer registered for block type: "mystery"/,
    )
  })

  it('still renders known blocks', () => {
    expect(pb.renderBlock({_type: 'hero', title: 'Hi'}, {locale: 'en'})).toBe('Hi')
  })
})

describe('section modules', () => {
  const defineSection = createSectionFactory<Block, Ctx, string>()
  const hero = defineSection({type: 'hero', query: 'title', render: (b) => `hero:${b.title}`})
  const faq = defineSection({type: 'faq', query: 'items', render: (b) => `faq:${b.items.length}`})

  const pb = createPageBuilderFromSections<Block, Ctx, string>([hero, faq])

  it('builds a working dispatcher from modules', () => {
    expect(pb.renderBlock({_type: 'hero', title: 'X'}, {locale: 'en'})).toBe('hero:X')
    expect(pb.rendererTypes).toEqual(['faq', 'hero'])
  })

  it('assembles a combined GROQ projection from per-section queries', () => {
    expect(pb.query).toBe('_type == "hero" => { title },\n_type == "faq" => { items }')
    expect(pb.queryByType).toEqual({hero: 'title', faq: 'items'})
  })

  it('throws on a duplicate section type', () => {
    expect(() => createPageBuilderFromSections<Block, Ctx, string>([hero, hero])).toThrowError(
      /Duplicate section module/,
    )
  })
})

describe('assertPageBuilderIntegrity', () => {
  const renderers = {hero: () => '', faq: () => ''}

  it('passes when everything is in sync', () => {
    expect(() =>
      assertPageBuilderIntegrity({
        renderers,
        registeredTypes: ['hero', 'faq'],
        query: '_type == "hero" => {}, _type == "faq" => {}',
      }),
    ).not.toThrow()
  })

  it('aggregates missing renderer, orphan, and GROQ gaps into one error', () => {
    expect(() =>
      assertPageBuilderIntegrity({
        renderers: {hero: () => '', extra: () => ''},
        registeredTypes: ['hero', 'cta'],
        query: '_type == "hero" => {}',
      }),
    ).toThrowError(
      /No renderer for: cta[\s\S]*Renderer not in registry: extra[\s\S]*Missing from GROQ projection: cta/,
    )
  })
})

describe('icon map', () => {
  const icons = createIconMap<string>({
    icons: {ai: 'AiIcon', shield: 'ShieldIcon'},
    fallback: 'Circle',
  })

  it('resolves known names', () => {
    expect(icons.resolve('ai')).toBe('AiIcon')
  })

  it('falls back for unknown/empty names', () => {
    expect(icons.resolve('nope')).toBe('Circle')
    expect(icons.resolve(undefined)).toBe('Circle')
    expect(icons.resolve('')).toBe('Circle')
  })

  it('sanitizes invisible characters in names', () => {
    const dirty = `ai${String.fromCharCode(0x200b)}` // trailing zero-width space
    expect(icons.resolve(dirty)).toBe('AiIcon')
  })

  it('strict mode throws on unknown names', () => {
    const strict = createIconMap<string>({icons: {ai: 'AiIcon'}, strict: true})
    expect(() => strict.resolve('nope')).toThrowError(/No icon registered/)
  })

  it('integrity check catches drift between declared names and the map', () => {
    expect(() =>
      assertIconMapIntegrity({icons: {ai: 'x'}, declaredNames: ['ai', 'shield']}),
    ).toThrowError(/No icon for declared name\(s\): shield/)
    expect(() =>
      assertIconMapIntegrity({icons: {ai: 'x', extra: 'y'}, declaredNames: ['ai']}),
    ).toThrowError(/unused name\(s\): extra/)
  })
})
