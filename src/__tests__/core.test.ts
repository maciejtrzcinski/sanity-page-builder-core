import {describe, expect, it, vi} from 'vitest'

import {
  createPageBuilder,
  findMissingRenderers,
  findOrphanRenderers,
  findTypesMissingFromQuery,
} from '../index'

type Block = {_type: 'hero'; title: string} | {_type: 'faq'; items: string[]}

type Ctx = {locale: string}

const pb = createPageBuilder<Block, Ctx, string>({
  renderers: {
    hero: (block, ctx) => `hero:${block.title}:${ctx.locale}`,
    faq: (block) => `faq:${block.items.length}`,
  },
})

describe('createPageBuilder', () => {
  it('dispatches to the matching renderer with block + context', () => {
    expect(pb.renderBlock({_type: 'hero', title: 'Hi'}, {locale: 'en'})).toBe('hero:Hi:en')
    expect(pb.renderBlock({_type: 'faq', items: ['a', 'b']}, {locale: 'en'})).toBe('faq:2')
  })

  it('exposes sorted renderer types', () => {
    expect(pb.rendererTypes).toEqual(['faq', 'hero'])
  })

  it('hasRenderer reflects registration', () => {
    expect(pb.hasRenderer('hero')).toBe(true)
    expect(pb.hasRenderer('nope')).toBe(false)
  })

  it('returns null and warns (dev) for an unknown type by default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(pb.renderBlock({_type: 'mystery'}, {locale: 'en'})).toBeNull()
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('routes unknown types through a custom onMissing', () => {
    const custom = createPageBuilder<Block, Ctx, string>({
      renderers: {hero: (b) => b.title, faq: (b) => String(b.items.length)},
      onMissing: (type) => `fallback:${type}`,
    })
    expect(custom.renderBlock({_type: 'mystery'}, {locale: 'en'})).toBe('fallback:mystery')
  })

  it('renderBlock works when detached from the instance', () => {
    const {renderBlock} = pb
    expect(renderBlock({_type: 'faq', items: ['x']}, {locale: 'en'})).toBe('faq:1')
  })
})

describe('parity helpers', () => {
  const renderers = {hero: () => null, faq: () => null}

  it('findMissingRenderers finds registered types without a renderer', () => {
    expect(findMissingRenderers(['hero', 'faq', 'cta'], renderers)).toEqual(['cta'])
  })

  it('findOrphanRenderers finds renderers not in the registry', () => {
    expect(findOrphanRenderers(['hero'], renderers)).toEqual(['faq'])
  })

  it('findTypesMissingFromQuery finds types absent from a GROQ string', () => {
    const query = '_type == "hero" => {title}'
    expect(findTypesMissingFromQuery(['hero', 'faq'], query)).toEqual(['faq'])
  })
})
