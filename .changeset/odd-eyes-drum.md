---
'@maciejtrzcinski/sanity-page-builder-core': patch
---

Bump all devDependencies to latest. Notably `@sanity/pkg-utils` 10 → 12, which required removing the now-default `dts: 'rolldown'` option and disabling the new TSDoc/`@public` release-tag check (`tsdoc: false`) in `package.config.ts`, since this package doesn't tag exports with release tags. `typescript` stays pinned to `^6.0.3` until `typescript-eslint` supports TypeScript 7.
