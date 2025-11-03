import { promises as fs } from 'node:fs'
import process from 'node:process'
import { type UnpluginFactory, createUnplugin } from 'unplugin'
import type { DeepRequired, Options, ResolvedOptions } from './types'
import { generateScript } from './core/generate'
import { resolveOptions } from './core/options'
import { createCompress } from './core/compress'

const virtualEnvId = 'virtual:env'
const resolvedVirtualEnvId = `\0${virtualEnvId}`
let base = ''

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options = {}) => {
  const resolved = resolveOptions(options)
  return [{
    name: 'plugin-env-serve',
    apply: 'serve',
    enforce: 'post',
    configResolved(config: any) {
      base = config.base
    },
    async resolveId(id) {
      if (id.startsWith(virtualEnvId))
        return resolvedVirtualEnvId
    },
    async load(id) {
      if (id.startsWith(resolvedVirtualEnvId)) {
        const { code, watchFiles } = await generateScript(resolved as DeepRequired<ResolvedOptions>, 'serve', base)

        watchFiles.forEach((file) => {
          this.addWatchFile(file)
        })
        return code
      }
    },
  }, {
    name: 'unplugin-env-build',
    apply: 'build',
    enforce: 'post',
    configResolved(config: any) {
      base = config.base
    },
    resolveId(id) {
      if (id.startsWith(virtualEnvId))
        return resolvedVirtualEnvId
    },
    async load(id) {
      const { emit, script } = await generateScript(resolved as DeepRequired<ResolvedOptions>, 'build', base)
      if (id.startsWith(resolvedVirtualEnvId)) {
        this.emitFile(emit)
        return ''
      }
      if (id.endsWith('.html')) {
        let code = await fs.readFile(id, 'utf8')
        code = code.replace(/<\/head>/g, script)
        return {
          code,
        }
      }

      return null
    },
    buildEnd: () => {
      process.on('beforeExit', async () => {
        const { compress } = resolved
        await createCompress(compress as DeepRequired<ResolvedOptions['compress']>)
        process.exit(0)
      })
    },
  }]
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
