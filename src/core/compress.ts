// 假设 Options 类型已经在此文件中定义
import process from 'node:process'
import * as compressing from 'compressing'
import { Log } from './log'

/**
 * 生成一个ZIP格式的压缩文件。
 * @param options 压缩选项，具体选项取决于 compressing.zip.compressDir 支持的参数。
 * @returns 返回一个Promise，该Promise会在压缩完成后被解析。
 */
export async function createCompress(options: Options) {
  Log.log('Compressing the directory', options)
  try {
    await compressing.zip.compressDir('./dist', './dist.zip')
    Log.success('Successfully compressed the directory', options)
    process.exit(0)
  }
  catch (error) {
    Log.error('Error compressing the directory', error)
    throw error // 抛出错误供调用者处理
  }
}
