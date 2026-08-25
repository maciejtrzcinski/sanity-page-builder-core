import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  tsconfig: 'tsconfig.dist.json',
  // Skip the TSDoc/release-tag check — this package doesn't tag exports with @public.
  tsdoc: false,
})
