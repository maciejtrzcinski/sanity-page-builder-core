import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  tsconfig: 'tsconfig.dist.json',
  // rolldown dts generator skips api-extractor's @public release-tag requirement.
  dts: 'rolldown',
})
