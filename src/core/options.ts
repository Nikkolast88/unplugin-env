import type { PluginBuild as EsbuildBuild } from 'esbuild'
import type { OutputOptions as RollupOutputOptions } from 'rollup'
import type { ResolvedConfig as ViteConfig } from 'vite'

import type { Compiler as WebpackCompiler } from 'webpack'
import type { DeepRequired, Options, ResolvedOptions } from '../types'
import process from 'node:process'
import { deepMerge } from '@antfu/utils'
import { generateScript } from './generate'

export function resolveOptions(options: Options) {
  const defaults = {
    env: {
      dir: 'config',
      fileName: 'manifest.js',
      globalName: 'manifest',
      serve: /dev/i,
      build: /prod/i,
    },
    compress: {
      ignoreBase: false,
    },
  }

  const mergeOptions = deepMerge(defaults, options)
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'full',
    timeStyle: 'medium',
  })
  return {
    ...mergeOptions,
    datetime: formatter.format(new Date()),
  } as ResolvedOptions
}

interface ExtendedEsbuildBuild extends EsbuildBuild {
  initialOptions: EsbuildBuild['initialOptions'] & {
    watch?: boolean
  }
}

export type FrameworkType
  = | 'vite'
    | 'rollup'
    | 'webpack'
    | 'esbuild'
    | 'rspack'
    | 'farm'
    | 'rolldown'
    | ''

export type UnifiedMode = 'dev' | 'build'

export interface UnifiedContext {
  framework: FrameworkType
  base: string
  outDir: string
  mode: UnifiedMode
  isDev: boolean
  isBuild: boolean
  scriptInfo: {
    code: string
    script: string
    emit: {
      type: 'asset'
      source: string
      fileName: string
    }
    watchFiles: string[]
  }

  setVite: (config: ViteConfig) => void
  setRollup: (options: RollupOutputOptions) => void
  setWebpack: (compiler: WebpackCompiler) => void
  setRspack: (compiler: WebpackCompiler) => void
  setEsbuild: (build: ExtendedEsbuildBuild) => void
  setFarm: (compiler: any) => void
  setRolldown: (options: any) => void
}

export function createUnifiedContext(resolved: DeepRequired<ResolvedOptions>): UnifiedContext {
  const ctx: UnifiedContext = {
    framework: '',
    base: '/',
    outDir: 'dist',
    mode: 'build',
    scriptInfo: {
      code: '',
      script: '',
      emit: {
        type: 'asset',
        source: '',
        fileName: '',
      },
      watchFiles: [],
    },

    get isDev() {
      return this.mode === 'dev'
    },
    get isBuild() {
      return this.mode === 'build'
    },

    // --- VITE ---
    async setVite(config) {
      this.framework = 'vite'
      this.base = config.base || '/'
      this.outDir = config.build?.outDir || 'dist'
      this.mode = config.command === 'serve' ? 'dev' : 'build'
      ctx.scriptInfo = await generateScript(resolved, ctx)
    },

    // --- ROLLUP ---
    async setRollup(options) {
      this.framework = 'rollup'
      this.outDir = options.dir || 'dist'
      this.mode = process.env.ROLLUP_WATCH ? 'dev' : 'build'
      ctx.scriptInfo = await generateScript(resolved, ctx)
    },

    // --- WEBPACK ---
    async setWebpack(compiler) {
      this.framework = 'webpack'
      this.base = (compiler.options.output?.publicPath as string) || '/'
      this.outDir = compiler.options.output?.path || 'dist'
      const raw = compiler.options.mode || 'production'
      this.mode = raw === 'development' ? 'dev' : 'build'
      ctx.scriptInfo = await generateScript(resolved, ctx)
    },

    // --- RSPACK ---
    async setRspack(compiler) {
      this.framework = 'rspack'
      // Rspack 兼容 Webpack 配置结构
      this.base = (compiler.options.output?.publicPath as string) || '/'
      this.outDir = compiler.options.output?.path || 'dist'
      const raw = compiler.options.mode || 'production'
      this.mode = raw === 'development' ? 'dev' : 'build'
      ctx.scriptInfo = await generateScript(resolved, ctx)
    },

    // --- ESBUILD ---
    async setEsbuild(build) {
      this.framework = 'esbuild'
      this.outDir = build.initialOptions.outdir || 'dist'
      this.mode = (build.initialOptions as any).watch ? 'dev' : 'build'
      ctx.scriptInfo = await generateScript(resolved, ctx)
    },

    // --- FARM ---
    async setFarm(compiler) {
      this.framework = 'farm'
      this.base = compiler.config.output?.publicPath || '/'
      this.outDir = compiler.config.output?.path || 'dist'
      const raw = compiler.config.mode || 'production'
      this.mode = raw === 'development' ? 'dev' : 'build'
      ctx.scriptInfo = await generateScript(resolved, ctx)
    },

    // --- ROLLDOWN ---
    async setRolldown(options) {
      this.framework = 'rolldown'
      this.outDir = options.dir || 'dist'
      this.mode = process.env.ROLLDOWN_WATCH ? 'dev' : 'build'
      ctx.scriptInfo = await generateScript(resolved, ctx)
    },
  }

  return ctx
}
