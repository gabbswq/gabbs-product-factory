import { defineConfig } from 'vite'

export default defineConfig({
  base: '/millennium/',
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
})
