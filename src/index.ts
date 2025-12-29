import type { OutputOptions as RollupOutputOptions } from 'rollup'
import type { UnpluginFactory } from 'unplugin'
import type { DeepRequired, Options, ResolvedOptions } from './types'
import { promises as fs } from 'node:fs'
import process from 'node:process'
import { createUnplugin } from 'unplugin'
import { createCompress } from './core/compress'
import { createUnifiedContext, resolveOptions } from './core/options'

const virtualEnvId = 'virtual:env'
const virtualEnvAliasId = 'virtual-env'
const resolvedVirtualEnvId = `\0${virtualEnvId}`
const resolvedVirtualEnvAliasId = `\0${virtualEnvAliasId}`

function isVirtualEnvId(id: string) {
  return id.startsWith(virtualEnvId) || id.startsWith(virtualEnvAliasId)
}
function resolveVirtualEnvId(id: string) {
  return id.startsWith(virtualEnvAliasId) ? resolvedVirtualEnvAliasId : resolvedVirtualEnvId
}
function isResolvedVirtualEnvId(id: string) {
  return id.startsWith(resolvedVirtualEnvId) || id.startsWith(resolvedVirtualEnvAliasId)
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options = {}) => {
  const resolved = resolveOptions(options) as DeepRequired<ResolvedOptions>
  const ctx = createUnifiedContext(resolved)
  let frameworkReady: Promise<void> | null = null
  return [{
    name: 'plugin-env',
    enforce: 'post',
    rollup: {
      async buildStart() {
        const outputOptions: RollupOutputOptions = { dir: ctx.outDir }
        await ctx.setRollup(outputOptions)
      },
      outputOptions(outputOptions) {
        ctx.outDir = outputOptions.dir || ctx.outDir
        return outputOptions
      },
    },
    vite: {
      async configResolved(config) {
        await ctx.setVite(config)
      },
    },
    async webpack(compiler) {
      frameworkReady = ctx.setWebpack(compiler)
      const webpackLib = compiler.webpack
      compiler.hooks.thisCompilation.tap('plugin-env', (compilation) => {
        if (webpackLib?.Compilation?.PROCESS_ASSETS_STAGE_PRE_PROCESS) {
          const { Compilation, sources } = webpackLib
          compilation.hooks.processAssets.tapPromise(
            { name: 'plugin-env', stage: Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS },
            async () => {
              await frameworkReady
              const manifestName = ctx.scriptInfo.emit.fileName
              if (!manifestName)
                return
              const asset = compilation.getAsset(manifestName)
              if (!asset || asset.info?.minimized)
                return
              compilation.updateAsset(manifestName, asset.source, { ...asset.info, minimized: true })
            },
          )
          compilation.hooks.processAssets.tapPromise(
            { name: 'plugin-env', stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE },
            async (assets) => {
              await frameworkReady
              const { script } = ctx.scriptInfo
              if (!script)
                return
              const scriptTag = script.replace(/<\/head>\s*$/i, '').trim()
              for (const name of Object.keys(assets)) {
                if (!name.endsWith('.html'))
                  continue
                const asset = compilation.getAsset(name)
                const html = asset?.source.source().toString() || ''
                if (!html || html.includes(scriptTag))
                  continue
                const nextHtml = html.replace(/<\/head>/i, script)
                if (nextHtml !== html)
                  compilation.updateAsset(name, new sources.RawSource(nextHtml))
              }
            },
          )
        }
        else {
          compilation.hooks.emit.tapAsync('plugin-env', async (comp, cb) => {
            try {
              await frameworkReady
              const { script } = ctx.scriptInfo
              if (!script)
                return cb()
              const scriptTag = script.replace(/<\/head>\s*$/i, '').trim()
              for (const name of Object.keys(comp.assets)) {
                if (!name.endsWith('.html'))
                  continue
                const asset = comp.assets[name]
                const html = asset?.source().toString() || ''
                if (!html || html.includes(scriptTag))
                  continue
                const nextHtml = html.replace(/<\/head>/i, script)
                if (nextHtml !== html) {
                  comp.assets[name] = {
                    source: () => nextHtml,
                    size: () => nextHtml.length,
                  }
                }
              }
              cb()
            }
            catch (error) {
              cb(error as Error)
            }
          })
        }
      })
    },
    rspack: async (compiler) => {
      frameworkReady = ctx.setRspack(compiler)
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
      if (isVirtualEnvId(id))
        return resolveVirtualEnvId(id)
    },
    loadInclude(id) {
      if (isResolvedVirtualEnvId(id) || isVirtualEnvId(id))
        return true
      if (id.endsWith('.html')) {
        return ctx.framework === 'vite' || ctx.framework === 'rollup' || ctx.framework === 'rolldown'
      }
      return false
    },
    async load(id) {
      if (frameworkReady)
        await frameworkReady
      const { code, watchFiles, emit, script } = ctx.scriptInfo
      if (ctx.isDev) {
        if (isResolvedVirtualEnvId(id)) {
          watchFiles.forEach((file) => {
            this.addWatchFile(file)
          })
          return code
        }
      }
      else {
        if (isResolvedVirtualEnvId(id)) {
          this.emitFile(emit)
          return ''
        }
        const canTransformHtml = ctx.framework === 'vite' || ctx.framework === 'rollup' || ctx.framework === 'rolldown'
        if (canTransformHtml && id.endsWith('.html')) {
          let code = await fs.readFile(id, 'utf-8')
          code = code.replace(/<\/head>/g, script)
          return { code }
        }
      }
    },
    transformInclude(id) {
      return /\.(?:c|m)?(?:j|t)sx?$/.test(id)
    },
    async transform(code, id) {
      if (ctx.framework !== 'webpack' && ctx.framework !== 'rspack')
        return
      if (!id.match(/\.(?:c|m)?(?:j|t)sx?$/))
        return
      if (!code.includes(virtualEnvId))
        return
      return code.replaceAll(virtualEnvId, virtualEnvAliasId)
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
