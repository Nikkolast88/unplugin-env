import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import html from '@rollup/plugin-html'
import Unplugin from '../src/rollup.ts'

const templatePath = new URL('./index.html', import.meta.url)
const inputPath = fileURLToPath(new URL('./main.js', import.meta.url))
const outputDir = fileURLToPath(new URL('./rollup-dist', import.meta.url))

function htmlTemplate({ files, publicPath }) {
  const base = readFileSync(templatePath, 'utf-8')
  const scripts = (files.js || [])
    .map(({ fileName }) => `<script src="${publicPath}${fileName}"></script>`)
    .join('\n')

  const withoutEntry = base.replace(
    /<script\s+type="module"[^>]*src="\.\/main\.js"[^>]*><\/script>\s*/i,
    '',
  )

  return withoutEntry.replace(/<\/body>/i, `  ${scripts}\n</body>`)
}

/** @type {import('rollup').RollupOptions} */
export default {
  input: inputPath,
  output: {
    dir: outputDir,
    entryFileNames: 'index.js',
    format: 'iife',
  },
  plugins: [
    Unplugin(),
    html({
      template: htmlTemplate,
    }),
  ],
}
