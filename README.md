# @maciejtrzcinski/sanity-page-builder-core

A tiny, **dependency-free** typed dispatcher for Sanity page-builder blocks. It is
the generic mechanism behind a page builder — a renderer registry, a render
function, and parity helpers — with **none of your sections, design system, or
schema baked in**. You bring the block union, the context, and the node type.

No React/Sanity dependency: the node type is a generic parameter, so the same
package works whether you render to React, strings, or anything else.

## Why this exists

The bespoke part of a page builder (the section components) is welded to one
design system and isn't reusable. The _generic_ part is small and identical
across projects: "look up `block._type` in a map, call the renderer, keep the map
in sync with the schema." This package is exactly that part — so each project
keeps its own sections and shares the plumbing + the parity test.

## Install

```sh
npm install @maciejtrzcinski/sanity-page-builder-core
```

## Usage

```ts
// registry.ts
import type {ReactNode} from 'react'
import {createPageBuilder} from '@maciejtrzcinski/sanity-page-builder-core'
import type {PageBuilderBlock} from './types' // your typegen union
import {MARKETING_RENDERERS, INDEX_RENDERERS} from './renderers'

export type RenderContext = {/* whatever your renderers need */}

const pageBuilder = createPageBuilder<PageBuilderBlock, RenderContext, ReactNode>({
  renderers: {...MARKETING_RENDERERS, ...INDEX_RENDERERS},
  // onMissing?: (type, block, context) => ReactNode | null   // default: warn (dev) + null
})

export const renderBlock = pageBuilder.renderBlock
export const rendererTypes = pageBuilder.rendererTypes
export const BLOCK_RENDERERS = pageBuilder.renderers // for the parity test below
```

```tsx
// PageBuilder.tsx — or use renderPageBuilderBlocks (below), which also skips null blocks
{
  blocks?.map((block) => <Fragment key={block._key}>{renderBlock(block, context)}</Fragment>)
}
```

The `renderers` argument is typed `RendererMap<TBlock, TContext, TNode>` — a
mapped type over `TBlock['_type']`, so the **compiler requires a correctly-typed
renderer for every block variant**. Each renderer receives the narrowed block
(`Extract<TBlock, {_type: K}>`) and your context.

An extra key is a compile error only when it's written in the object literal
itself. Keys that arrive through a spread (like `...MARKETING_RENDERERS` above)
are not checked, so use `findOrphanRenderers` (below) to catch those.

## Parity test

Keep the renderer map in lockstep with your schema's section registry and your
GROQ projection. The helpers do the diffing; you supply the sources (loading them
is project-specific — a file path, a query string):

```ts
import {
  findMissingRenderers,
  findOrphanRenderers,
  findTypesMissingFromQuery,
} from '@maciejtrzcinski/sanity-page-builder-core'
import {BLOCK_RENDERERS} from '../registry'
import {pageBuilderFields} from '@/sanity/lib/query-page-builder'

const registeredTypes = loadSectionTypesFromStudioRegistry() // your loader

it('a renderer for every registered section', () => {
  expect(findMissingRenderers(registeredTypes, BLOCK_RENDERERS)).toEqual([])
})
it('no renderer for an unregistered section', () => {
  expect(findOrphanRenderers(registeredTypes, BLOCK_RENDERERS)).toEqual([])
})
it('a GROQ conditional for every section', () => {
  expect(findTypesMissingFromQuery(registeredTypes, pageBuilderFields)).toEqual([])
})
```

`findTypesMissingFromQuery` looks for the exact text `_type == "<type>"` in the
query string: double quotes, with a space on each side of `==`.

## Deriving the block type from typegen

The concrete block union is project-specific (it comes from your Sanity typegen),
but the extraction is generic — pass your query result type:

```ts
import type {
  PageBuilderBlockOf,
  PageBuilderBlocksOf,
} from '@maciejtrzcinski/sanity-page-builder-core'
import type {PageDocQueryResult} from './sanity.types'

export type PageBuilderBlocks = PageBuilderBlocksOf<PageDocQueryResult> // the array (incl. null)
export type PageBuilderBlock = PageBuilderBlockOf<PageDocQueryResult> // the non-null member union
// Custom field name: PageBuilderBlockOf<MyDoc, 'sections'>
```

## Guardrails (force the architecture)

- **Strict mode** — `createPageBuilder({renderers, strict: true})` throws on a block
  whose `_type` has no renderer, instead of skipping it. Forces registration, and
  takes precedence over `onMissing`.
- **Integrity gate** — one assertion that fails loudly if the renderer map, the
  registered types, and the GROQ projection drift apart:

  ```ts
  import {assertPageBuilderIntegrity} from '@maciejtrzcinski/sanity-page-builder-core'
  assertPageBuilderIntegrity({
    renderers: BLOCK_RENDERERS,
    registeredTypes,
    query: pageBuilderFields,
  })
  ```

- **Section modules** — co-locate each section's `type`, `render`, and GROQ
  `query` so they can't drift. Build the page builder (and the combined GROQ
  projection) from them:

  ```ts
  const defineSection = createSectionFactory<PageBuilderBlock, RenderContext, ReactNode>()
  const hero = defineSection({type: 'heroSection', query: `title, subtitle`, render: (b) => <Hero .../>})

  const pb = createPageBuilderFromSections([hero, /* … */], {strict: true})
  pb.query // → `_type == "heroSection" => { title, subtitle }, …`  (throws on duplicate type)
  ```

  The block union, context, and node type are inferred from the sections — don't
  pass type arguments. Leaving out a section for any block type in the union is a
  **compile error** that names the missing `_type`:

  ```ts
  createPageBuilderFromSections([hero])
  // compile error: … { readonly 'Missing section module for _type': "faqSection" }
  ```

  The check is skipped for loosely-typed sections (`AnySectionModule[]`), since
  their block union is unknown.

## Rendering the blocks

`renderPageBuilderBlocks` owns the loop + the visual-editing convention
(`key` / section-anchor `id` / `data-sanity` attribute) while staying React-free —
you pass the values and a `wrap` callback that creates the elements:

```tsx
import {createDataAttribute} from 'next-sanity'

{
  renderPageBuilderBlocks(blocks, context, {
    renderBlock,
    documentId,
    pathBase,
    dataAttr: (p) => createDataAttribute(p).toString(),
    wrap: (content, {key, id, editAttr}) =>
      editAttr ? (
        <div key={key} id={id} data-sanity={editAttr}>
          {content}
        </div>
      ) : id ? (
        <div key={key} id={id}>
          {content}
        </div>
      ) : (
        <Fragment key={key}>{content}</Fragment>
      ),
  })
}
```

What it does per block:

- Skips `null`/`undefined` blocks, and blocks whose renderer returns `null` or `undefined`.
- `key` is the block's `_key`.
- `id` is the block's `sectionIdField` value (default `'sectionId'`), only when
  it's a non-blank string.
- `editAttr` is set only when you pass both `documentId` and `dataAttr`. It is
  called with `{id: documentId, type: block._type, path: [pathBase, index]}`,
  where `pathBase` defaults to `'pageBuilder'` and `index` is the block's position
  in the original array.

## Icon map

A name → icon resolver with the same registration discipline (name cleanup, a
fallback, and parity helpers), generic over the icon type so it stays React-free:

```ts
const icons = createIconMap({icons: SECTION_ICON_COMPONENTS, fallback: Circle})
icons.resolve(block.icon?.name) // → component (or Circle)
assertIconMapIntegrity({icons: SECTION_ICON_COMPONENTS, declaredNames: studioIconNames})
```

## API

| Export                                                                                 | Purpose                                                                                                    |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `createPageBuilder({renderers, strict?, onMissing?})`                                  | Build the dispatcher → `{renderBlock, rendererTypes, renderers, hasRenderer}`.                             |
| `createSectionFactory<TBlock,TContext,TNode>()`                                        | Returns a typed `defineSection` for co-located section modules.                                            |
| `createPageBuilderFromSections(sections, {strict?, onMissing?})`                       | The dispatcher plus `query`, `queryByType` and `sections`; a compile error if a block type has no section. |
| `renderPageBuilderBlocks(blocks, context, opts)`                                       | Framework-agnostic render loop + visual-editing convention.                                                |
| `assertPageBuilderIntegrity({renderers, registeredTypes, query?})`                     | One gate that throws on renderer/registry/GROQ drift.                                                      |
| `findMissingRenderers` / `findOrphanRenderers` / `findTypesMissingFromQuery`           | Individual parity diffs.                                                                                   |
| `createIconMap({icons, fallback?, strict?, sanitize?})`                                | Name → icon resolver → `{resolve, has, names, icons}`.                                                     |
| `findMissingIcons` / `findOrphanIcons` / `assertIconMapIntegrity` / `sanitizeIconName` | Icon parity + name cleanup.                                                                                |
| `PageBuilderBlockOf` / `PageBuilderBlocksOf`                                           | Extract the block union / array from a typegen query result.                                               |

### Types

```ts
interface BlockLike {
  _type: string
  _key?: string
}

type BlockRenderer<TBlock extends BlockLike, TContext, TNode> = (
  block: TBlock,
  context: TContext,
) => TNode

type RendererMap<TBlock extends BlockLike, TContext, TNode> = {
  [K in TBlock['_type']]: BlockRenderer<Extract<TBlock, {_type: K}>, TContext, TNode>
}

interface PageBuilder<TBlock extends BlockLike, TContext, TNode> {
  readonly renderers: RendererMap<TBlock, TContext, TNode>
  readonly rendererTypes: readonly string[] // sorted
  hasRenderer(type: string): boolean
  renderBlock(block: TBlock | BlockLike, context: TContext): TNode | null
}
```

Also exported as types: `CreatePageBuilderOptions`, `SectionModule`,
`AnySectionModule`, `SectionPageBuilder`, `BlockWrapInfo`,
`RenderPageBuilderBlocksOptions`, `IntegrityInput`, `IconMap`, `IconMapOptions`.

## What this is NOT

It does not provide section components, normalization, link/image resolution, or
GROQ queries (beyond joining the per-section fragments you write) — those are
project-specific and stay in your app. This is only the typed dispatch + parity
plumbing.

## Developing

```sh
pnpm install
pnpm check          # lint + format:check + type-check + knip + test (what CI runs)
pnpm build          # ESM + CJS + d.ts (pkg-utils)
pnpm test           # vitest
pnpm type-check     # tsc --noEmit
pnpm lint           # eslint
pnpm format         # prettier --write
pnpm knip           # unused files / exports / deps
```

A husky pre-commit hook runs ESLint + Prettier (via lint-staged) on staged
files. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.

## Contributing

Issues and pull requests are welcome — see
[CONTRIBUTING.md](./CONTRIBUTING.md) and our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## License

[MIT](./LICENSE) © Maciej Trzciński
