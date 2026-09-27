import { defineConfig } from 'vite'

export default defineConfig({
  base: '/gabbs-product-factory/',
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
})
