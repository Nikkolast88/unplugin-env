import { deepMerge } from '@antfu/utils'
import type { Options, ResolvedOptions } from '../types'

// 当配置项为数据数据类型时，需注意拷贝问题
// var a = {a: 1, b: 2, env: { a: 1, b:2 }};var b = {c: 3, env: {c: 3}};console.log({...a, ...b})
// a: 1
// b: 2
// c: 3
// env
// :
// {c: 3}
export async function resolveOptions(options: Options): Promise<ResolvedOptions> {
  const defaults = {
    env: {
      dir: 'config',
      fileName: 'manifest.js',
      globalName: 'manifest',
      serve: /dev|development/i,
      build: /prod|production/i,
    },
  }

  const mergeOptions = deepMerge(defaults, options)

  return {
    ...mergeOptions,
    date: new Date().toString(),
  } as ResolvedOptions
}
