import {describe, expect, it} from 'vitest'

import {
  assertIconMapIntegrity,
  assertPageBuilderIntegrity,
  createIconMap,
  createPageBuilder,
  createPageBuilderFromSections,
  findMissingIcons,
  findMissingRenderers,
} from '../index'

// Names every plain object inherits from `Object.prototype`. None of them is registered.
const INHERITED = ['constructor', 'toString', 'hasOwnProperty', 'valueOf', '__proto__']

type Block = {_type: 'hero'; title: string}
type Ctx = {locale: string}

const ctx: Ctx = {locale: 'en'}

describe('names inherited from Object.prototype', () => {
  const renderers = {hero: (b: Block) => b.title}
  const pb = createPageBuilder<Block, Ctx, string>({
    renderers,
    onMissing: (type) => `missing:${type}`,
  })
  const strictPb = createPageBuilder<Block, Ctx, string>({renderers, strict: true})

  it.each(INHERITED)('hasRenderer(%j) is false', (type) => {
    expect(pb.hasRenderer(type)).toBe(false)
  })

  it.each(INHERITED)('renderBlock routes %j through onMissing', (type) => {
    expect(pb.renderBlock({_type: type}, ctx)).toBe(`missing:${type}`)
  })

  it.each(INHERITED)('renderBlock throws on %j in strict mode', (type) => {
    expect(() => strictPb.renderBlock({_type: type}, ctx)).toThrowError(
      /No renderer registered for block type/,
    )
  })

  it.each(INHERITED)('findMissingRenderers reports %j', (type) => {
    expect(findMissingRenderers([type], {})).toEqual([type])
    expect(() => assertPageBuilderIntegrity({renderers: {}, registeredTypes: [type]})).toThrowError(
      /No renderer for:/,
    )
  })

  describe('icon map', () => {
    const icons = createIconMap<string>({icons: {ai: 'AiIcon'}, fallback: 'Circle'})
    const strictIcons = createIconMap<string>({icons: {ai: 'AiIcon'}, strict: true})

    it.each(INHERITED)('has(%j) is false', (name) => {
      expect(icons.has(name)).toBe(false)
    })

    it.each(INHERITED)('resolve(%j) returns the fallback', (name) => {
      expect(icons.resolve(name)).toBe('Circle')
    })

    it.each(INHERITED)('resolve(%j) throws in strict mode', (name) => {
      expect(() => strictIcons.resolve(name)).toThrowError(/No icon registered/)
    })

    it.each(INHERITED)('findMissingIcons reports %j', (name) => {
      expect(findMissingIcons([name], {})).toEqual([name])
      expect(() => assertIconMapIntegrity({icons: {}, declaredNames: [name]})).toThrowError(
        /No icon for declared name/,
      )
    })
  })

  it('a section whose type is an inherited name is not a duplicate', () => {
    const sections = [
      {type: 'constructor', render: () => 'constructor section'},
      {type: 'toString', render: () => 'toString section'},
    ]
    const fromSections = createPageBuilderFromSections(sections)
    expect(fromSections.rendererTypes).toEqual(['constructor', 'toString'])
    expect(fromSections.renderBlock({_type: 'constructor'}, ctx)).toBe('constructor section')
    expect(fromSections.hasRenderer('valueOf')).toBe(false)
  })

  it('an own key with an inherited name is still registered', () => {
    const icons = createIconMap<string>({icons: {constructor: 'Hammer'}, strict: true})
    expect(icons.has('constructor')).toBe(true)
    expect(icons.resolve('constructor')).toBe('Hammer')
    expect(findMissingRenderers(['constructor'], {constructor: () => null})).toEqual([])
  })
})
