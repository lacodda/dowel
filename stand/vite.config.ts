import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Served under the project page alongside the documentation.
  base: '/dowel/stand/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // What a copied component imports; here it is the source next door.
      'dowel-ui': new URL('../packages/dowel/src/index.ts', import.meta.url).pathname,
    },
  },
})
