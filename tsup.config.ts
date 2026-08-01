import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'exports/next': 'src/exports/next.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['payload', 'next', 'next/cache', '@payloadcms/richtext-lexical'],
})
