import path, { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import process from 'node:process'
import fg from 'fast-glob'
import { loadFile } from 'magicast'
import { deepMerge } from '@antfu/utils'
import js_beautify from 'js-beautify'
import type { DeepRequired, GenerateScript, ResolvedOptions } from '../types'

/**
 * 生成脚本
 * @param options - 解析的选项
 * @param mode - 模式，可以是'serve'或'build'
 * @returns 返回一个Promise，其值为GenerateScript对象
 */
export async function generateScript(options: DeepRequired<ResolvedOptions>, mode: 'serve' | 'build'): Promise<GenerateScript> {
  const { dir, fileName, globalName, serve, build } = options.env
  const folder = await findFolder(process.cwd(), dir)
  const files = await fg('*.+(js|ts)', {
    absolute: true,
    cwd: folder,
  })
  // build or serve RegExp
  const testReg = mode === 'serve' ? serve : build
  let target = {}
  const source = []
  let code = ''
  const name = fileName

  for (const file of files) {
    try {
      const mod = await loadFile(file)
      if (testReg?.test(file))
        target = mod.exports.default

      else
        source.push(mod.exports.default)
    }
    catch (error) {
      // Handle errors here if needed
      console.error(`Error loading file ${file}:`, error)
    }
  }
  const returnedTarget = deepMerge({}, source, target)
  const versionInfo = await generateVersion(options, mode)
  code = `window.${globalName}=${JSON.stringify(returnedTarget)};${versionInfo}`
  const formatCode = js_beautify.js_beautify(code)
  return {
    code,
    script: `  <script type="text/javascript" src="/${fileName}"></script>\n</head>`,
    emit: {
      type: 'asset',
      fileName: name,
      source: formatCode,
    },
    watchFiles: files,
  }
}

/**
 * 生成版本信息
 * @param options - 解析的选项
 * @param mode - 模式，可以是'serve'或'build'
 * @returns 返回版本信息的字符串
 */
async function generateVersion(options: ResolvedOptions, mode: 'serve' | 'build') {
  const packageFile = await fg('package.json', {
    absolute: true,
    cwd: resolve(process.cwd()),
  })
  const packageString = await fs.readFile(packageFile[0], 'utf8')
  const packageJson = JSON.parse(packageString)
  return `console.info("Version: ${packageJson.version} -  ${mode === 'serve' ? 'runtime' : 'built'} on ${options.date}")`
}

/**
 * 递归查找目录中是否存在指定的文件夹
 * @param directoryPath 目录路径
 * @param dir 需要查找的文件夹名
 * @returns 如果找到则返回文件夹路径，否则返回空字符串
 */
async function findFolder(directoryPath: string, dir: string): Promise<string> {
  const ignore = new Set(['dist', 'node_modules', 'playground', 'example', 'test', 'jest', 'tests', 'locales', 'public', '.git', '.github', '.vscode'])
  const files = await fs.readdir(directoryPath)
  const filePaths = files.filter(item => !ignore.has(item))
  let nestedFolder = ''
  for (const file of filePaths) {
    const fullFilePath = path.join(directoryPath, file)
    const stat = await fs.stat(fullFilePath)
    if (stat.isDirectory()) {
      if (file.toLowerCase() === dir) {
        return fullFilePath
      }
      else {
        nestedFolder = await findFolder(fullFilePath, dir)
        if (nestedFolder)
          return nestedFolder
      }
    }
  }
  return ''
}
