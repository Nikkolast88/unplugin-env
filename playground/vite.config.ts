import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Unplugin from '../src/vite'

export default defineConfig({
  build: {
    outDir: 'vite-dist',
  },
  plugins: [
    Inspect(),
    Unplugin(),
  ],
})
