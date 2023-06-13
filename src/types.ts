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
  // compress?: {
  //   outDir?: string
  //   adapter?: 'zip' | 'gzip' | 'tar'
  //   formatter: string
  // } | boolean
}

export interface ResolvedOptions extends Required<Options> {
  date: string
}

export interface GenerateScript {
  code: string
  script: string
  emit: {
    type: 'asset'
    source: string
    fileName: string
  }
}
