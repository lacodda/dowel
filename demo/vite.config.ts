import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/*
 * kilna-lite: a small product built from the blocks, served beside the stand.
 *
 * It imports the way a product does - `@/components/ui/...` and
 * `@/components/blocks/...` - and here those names are the registry's own
 * files, so what it draws is what `shadcn add` would put in a product today.
 */
export default defineConfig({
  base: '/dowel/demo/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // The subpath first: a string alias also matches `dowel-ui/...` as a
      // prefix, and would send it into the index file.
      'dowel-ui/marks': new URL('../packages/dowel/src/marks.ts', import.meta.url).pathname,
      'dowel-ui': new URL('../packages/dowel/src/index.ts', import.meta.url).pathname,
      '@/components/ui': new URL('../registry/ui', import.meta.url).pathname,
      '@/components/blocks': new URL('../registry/blocks', import.meta.url).pathname,
    },
  },
})
