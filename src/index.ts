import type { UnpluginFactory } from 'unplugin'
import type { DeepRequired, Options, ResolvedOptions } from './types'
import { promises as fs } from 'node:fs'
import process from 'node:process'
import { createUnplugin } from 'unplugin'
import { createCompress } from './core/compress'
import { generateScript } from './core/generate'
import { createUnifiedContext, resolveOptions } from './core/options'

const virtualEnvId = 'virtual:env'
const resolvedVirtualEnvId = `\0${virtualEnvId}`
const ctx = createUnifiedContext()

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options = {}) => {
  const resolved = resolveOptions(options)
  return [{
    name: 'plugin-env',
    enforce: 'post',
    rollup: {
      outputOptions(outputOptions) {
        ctx.setRollup(outputOptions)
      },
    },
    vite: {
      configResolved(config) {
        ctx.setVite(config)
      },
    },
    webpack(compiler) {
      ctx.setWebpack(compiler)
    },
    rspack: (compiler) => {
      ctx.setRspack(compiler)
    },
    esbuild: {
      setup(build) {
        ctx.setEsbuild(build)
      },
    },
    farm(compiler: any) {
      ctx.setFarm(compiler)
    },
    rolldown: {
      outputOptions(outputOptions: any) {
        ctx.setRolldown(outputOptions)
      },
    },
    async resolveId(id) {
      if (id.startsWith(virtualEnvId))
        return resolvedVirtualEnvId
    },
    async load(id) {
      const { code, watchFiles, emit, script } = await generateScript(resolved as DeepRequired<ResolvedOptions>, 'serve', ctx.base)
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
