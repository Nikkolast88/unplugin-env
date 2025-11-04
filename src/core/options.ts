import type { Options, ResolvedOptions } from '../types'
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
