import fs from 'node:fs'
import process from 'node:process'
import archiver from 'archiver'
import type { DeepRequired, ResolvedOptions } from '../types' // 假设你有一个名为 'types' 的文件，其中包含了 ResolvedOptions 类型的定义
import { Log } from './log'

export async function createCompress(options: DeepRequired<ResolvedOptions['compress']>) {
  const { outDir, ignoreBase } = options
  const zipFilePath = `${outDir}.zip` // 压缩文件的路径为 outDir.zip

  Log.log('Compressing the directory', outDir)

  try {
    // 创建一个输出流，将压缩后的数据写入到压缩文件中
    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver('zip', {
      zlib: { level: 9 }, // 设置压缩级别为最高
    })

    // 将输出流管道到 archiver 实例中
    archive.pipe(output)

    // 创建一个名为 dist 的顶层目录
    archive.directory(outDir, ignoreBase ? outDir : false)

    // 完成压缩并关闭输出流
    await archive.finalize()

    Log.success('Successfully compressed the directory', outDir)
    process.exit(0)
  }
  catch (error) {
    Log.error('Error compressing the directory', error)
    throw error // 抛出错误供调用者处理
  }
}
