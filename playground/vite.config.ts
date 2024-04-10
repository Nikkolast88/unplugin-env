import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Unplugin from '../src/vite'

export default defineConfig({
  build: {
    outDir: 'playground',
  },
  plugins: [
    Inspect(),
    Unplugin({
      compress: {
        outDir: 'playground',
      },
    }),
  ],
})
