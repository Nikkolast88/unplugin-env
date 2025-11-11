import type { PluginBuild as EsbuildBuild } from 'esbuild'
import type { OutputOptions as RollupOutputOptions } from 'rollup'
import type { ResolvedConfig as ViteConfig } from 'vite'

import type { Compiler as WebpackCompiler } from 'webpack'
import type { Options, ResolvedOptions } from '../types'
import process from 'node:process'
import { deepMerge } from '@antfu/utils'

// 当配置项为数据数据类型时，需注意拷贝问题
// var a = {a: 1, b: 2, env: { a: 1, b:2 }};var b = {c: 3, env: {c: 3}};console.log({...a, ...b})
// a: 1
// b: 2
// c: 3
// env
// :
// {c: 3}
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

// 新增 Farm 与 Rolldown 类型（可选）
interface FarmCompiler {
  config: {
    output?: { publicPath?: string, path?: string }
    mode?: 'development' | 'production'
  }
}

interface RolldownOutputOptions {
  dir?: string
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

  setVite: (config: ViteConfig) => void
  setRollup: (options: RollupOutputOptions) => void
  setWebpack: (compiler: WebpackCompiler) => void
  setRspack: (compiler: WebpackCompiler) => void
  setEsbuild: (build: ExtendedEsbuildBuild) => void
  setFarm: (compiler: any) => void
  setRolldown: (options: any) => void
}

export function createUnifiedContext(): UnifiedContext {
  const ctx: UnifiedContext = {
    framework: '',
    base: '/',
    outDir: 'dist',
    mode: 'build',

    get isDev() {
      return this.mode === 'dev'
    },
    get isBuild() {
      return this.mode === 'build'
    },

    // --- VITE ---
    setVite(config) {
      this.framework = 'vite'
      this.base = config.base || '/'
      this.outDir = config.build?.outDir || 'dist'
      this.mode = config.command === 'serve' ? 'dev' : 'build'
    },

    // --- ROLLUP ---
    setRollup(options) {
      this.framework = 'rollup'
      this.outDir = options.dir || 'dist'
      this.mode = process.env.ROLLUP_WATCH ? 'dev' : 'build'
    },

    // --- WEBPACK ---
    setWebpack(compiler) {
      this.framework = 'webpack'
      this.base = (compiler.options.output?.publicPath as string) || '/'
      this.outDir = compiler.options.output?.path || 'dist'
      const raw = compiler.options.mode || 'production'
      this.mode = raw === 'development' ? 'dev' : 'build'
    },

    // --- RSPACK ---
    setRspack(compiler) {
      this.framework = 'rspack'
      // Rspack 兼容 Webpack 配置结构
      this.base = (compiler.options.output?.publicPath as string) || '/'
      this.outDir = compiler.options.output?.path || 'dist'
      const raw = compiler.options.mode || 'production'
      this.mode = raw === 'development' ? 'dev' : 'build'
    },

    // --- ESBUILD ---
    setEsbuild(build) {
      this.framework = 'esbuild'
      this.outDir = build.initialOptions.outdir || 'dist'
      this.mode = (build.initialOptions as any).watch ? 'dev' : 'build'
    },

    // --- FARM ---
    setFarm(compiler) {
      this.framework = 'farm'
      this.base = compiler.config.output?.publicPath || '/'
      this.outDir = compiler.config.output?.path || 'dist'
      const raw = compiler.config.mode || 'production'
      this.mode = raw === 'development' ? 'dev' : 'build'
    },

    // --- ROLLDOWN ---
    setRolldown(options) {
      this.framework = 'rolldown'
      this.outDir = options.dir || 'dist'
      this.mode = process.env.ROLLDOWN_WATCH ? 'dev' : 'build'
    },
  }

  return ctx
}
