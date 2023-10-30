import { promises as fs } from 'node:fs'
import { type UnpluginFactory, createUnplugin } from 'unplugin'
import type { Options } from './types'
import { generateScript } from './core/generate'
import { resolveOptions } from './core/options'

const virtualEnvId = 'virtual:env'
const resolvedVirtualEnvId = `\0${virtualEnvId}`

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options = {}) => {
  const resolved = resolveOptions(options)
  return [{
    name: 'plugin-env-serve',
    apply: 'serve',
    enforce: 'post',
    async resolveId(id) {
      if (id.startsWith(virtualEnvId))
        return resolvedVirtualEnvId
    },
    async load(id) {
      if (id.startsWith(resolvedVirtualEnvId)) {
        const config = await resolved
        const { code } = await generateScript(config, 'serve')

        // this.addWatchFile(watchFolder)
        // console.log(this.getWatchFiles())
        return code
      }
    },
  }, {
    name: 'unplugin-env-build',
    apply: 'build',
    enforce: 'post',
    resolveId(id) {
      if (id.startsWith(virtualEnvId))
        return resolvedVirtualEnvId
    },
    async load(id) {
      const config = await resolved
      const { emit, script } = await generateScript(config, 'build')
      if (id.startsWith(resolvedVirtualEnvId)) {
        this.emitFile(emit)
        return ''
      }
      if (id.endsWith('.html')) {
        let code = await fs.readFile(id, 'utf8')
        code = code.replace(/<\/head>/gm, script)
        return {
          code,
        }
      }

      return null
    },
  }]
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
