export interface Options {
  // define your plugin options here
  env?: {
    /**
     * 全局变量名称
     * manifest
     */
    globalName?: string
    /**
     * 配置文件名
     * manifest.js
     */
    fileName?: string
    /**
     * config.dev|prod.ts配置文件存放位置
     * config
     */
    dir?: string
    /**
     * 用于正则，文件名中包含其中的开发环境
     * /dev|development/i
     */
    serve?: RegExp
    /**
     * 用于正则，文件名中包含其中的生产环境
     * /prod|production/i
     */
    build?: RegExp
  }
  compress?: {
    ignoreBase?: boolean
  }
}

// 定义一个递归函数，将对象中的所有属性转换为必填属性
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// 使用交叉类型将Options转换为必填类型
export type ResolvedOptions = DeepRequired<Options> & {
  datetime: string
}

export interface GenerateScript {
  code: string
  script: string
  emit: {
    type: 'asset'
    source: string
    fileName: string
  }
  watchFiles: string[]
}
