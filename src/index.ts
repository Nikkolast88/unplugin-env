import type { UnpluginFactory } from 'unplugin'
import type { DeepRequired, Options, ResolvedOptions } from './types'
import { promises as fs } from 'node:fs'
import process from 'node:process'
import { createUnplugin } from 'unplugin'
import { createCompress } from './core/compress'
import { createUnifiedContext, resolveOptions } from './core/options'

const virtualEnvId = 'virtual:env'
const resolvedVirtualEnvId = `\0${virtualEnvId}`

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options = {}) => {
  const resolved = resolveOptions(options) as DeepRequired<ResolvedOptions>
  const ctx = createUnifiedContext(resolved)
  return [{
    name: 'plugin-env',
    enforce: 'post',
    rollup: {
      outputOptions(outputOptions) {
        ctx.setRollup(outputOptions)
        return outputOptions
      },
    },
    vite: {
      async configResolved(config) {
        await ctx.setVite(config)
      },
    },
    async webpack(compiler) {
      await ctx.setWebpack(compiler)
    },
    rspack: async (compiler) => {
      await ctx.setRspack(compiler)
    },
    esbuild: {
      async setup(build) {
        await ctx.setEsbuild(build)
      },
    },
    async farm(compiler: any) {
      await ctx.setFarm(compiler)
    },
    rolldown: {
      async outputOptions(outputOptions: any) {
        await ctx.setRolldown(outputOptions)
      },
    },
    async resolveId(id) {
      if (id.startsWith(virtualEnvId))
        return resolvedVirtualEnvId
    },
    async load(id) {
      const { code, watchFiles, emit, script } = ctx.scriptInfo
      if (ctx.isDev) {
        if (id.startsWith(resolvedVirtualEnvId)) {
          watchFiles.forEach((file) => {
            this.addWatchFile(file)
          })
          return code
        }
      }
      else {
        if (id.startsWith(resolvedVirtualEnvId)) {
          this.emitFile(emit)
          return ''
        }
        if (id.endsWith('.html')) {
          let code = await fs.readFile(id, 'utf-8')
          code = code.replace(/<\/head>/g, script)
          return { code }
        }
      }
    },
    buildEnd: () => {
      process.on('beforeExit', async () => {
        const { compress } = resolved
        await createCompress(compress as DeepRequired<ResolvedOptions['compress']>, ctx.outDir)
        process.exit(0)
      })
    },
  }]
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
