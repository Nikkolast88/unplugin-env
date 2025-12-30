import type { DeepRequired, ResolvedOptions } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Zip } from 'zip-lib'
import { Log } from './log'

/**
 * 使用 zip-lib 压缩目录
 * @param options compress 配置
 * @param outDir 输出目录（被压缩的目录）
 */
export async function createCompress(
  options: DeepRequired<ResolvedOptions['compress']>,
  outDir: string,
) {
  const { includeBaseDir } = options

  // 输出文件路径，例如 dist.zip
  const zipFilePath = path.resolve(process.cwd(), `${path.basename(outDir)}.zip`)
  const absoluteOutDir = path.resolve(outDir)

  Log.log('Compressing directory:', absoluteOutDir)

  try {
    const zip = new Zip()

    if (!includeBaseDir) {
      // 直接把目录内容塞进 zip 根目录
      zip.addFolder(absoluteOutDir)
    }
    else {
      // 保留外层目录结构，例如 dist/** 放入 dist.zip 的 dist/ 下
      zip.addFolder(absoluteOutDir, path.basename(outDir))
    }

    // 执行压缩
    await zip.archive(zipFilePath)

    // 获取压缩后文件大小
    const stat = fs.statSync(zipFilePath)
    const size = stat.size

    const readableSize
      = size > 1024 * 1024
        ? `${(size / 1024 / 1024).toFixed(1)} MB`
        : `${(size / 1024).toFixed(1)} KB`

    Log.success(
      'Successfully compressed to:',
      `${zipFilePath} (${readableSize})`,
    )
    return null
  }
  catch (error) {
    Log.error('Compression error:', error)
    throw error
  }
}
