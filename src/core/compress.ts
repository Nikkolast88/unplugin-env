import type { DeepRequired, ResolvedOptions } from '../types' // 假设你有一个名为 'types' 的文件，其中包含了 ResolvedOptions 类型的定义
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import archiver from 'archiver'
import { Log } from './log'

export async function createCompress(options: DeepRequired<ResolvedOptions['compress']>, outDir: string) {
  const { ignoreBase } = options
  const zipFilePath = path.resolve(process.cwd(), `${path.basename(outDir)}.zip`) // 压缩文件的路径为 outDir.zip

  Log.log('Compressing the directory', outDir)

  return new Promise((resolve, reject) => {
    try {
      // 创建一个输出流，将压缩后的数据写入到压缩文件中
      const output = fs.createWriteStream(zipFilePath)
      const archive = archiver('zip')

      // 事件处理
      output.on('close', () => {
        const size = archive.pointer()
        const sizeInMB = size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`
        Log.success('Successfully compressed to', `${zipFilePath} (${sizeInMB})`)
        resolve(null)
      })

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT')
          Log.log('File not found during compression:', err.message)
        else
          Log.log('Compression warning:', err.message)
      })

      archive.on('error', (err) => {
        Log.error('Compression error:', err)
        reject(err)
      })
      // 将输出流管道到 archiver 实例中
      archive.pipe(output)
      // 添加目录
      const absoluteOutDir = path.resolve(outDir)
      archive.directory(absoluteOutDir, ignoreBase ? false : path.basename(outDir))

      // 完成压缩并关闭输出流
      archive.finalize()
    }
    catch (error) {
      Log.error('Error compressing the directory', error)
      throw error // 抛出错误供调用者处理
    }
  })
}
