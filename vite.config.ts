import { defineConfig } from '@ownclouders/extension-sdk'

export default defineConfig({
  name: 'ocis-app-tokens',
  server: {
    port: 9224
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'index.js'
      }
    }
  }
})
