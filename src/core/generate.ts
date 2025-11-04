import type { DeepRequired, GenerateScript, ResolvedOptions } from '../types'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import fg from 'fast-glob'
import { getPackageInfo } from 'local-pkg'
import recast from 'recast'

// 遍历 AST，找到 export default 对象节点，进行合并（仅替换同名 key）
function mergeObjects(prodObj: any, devObj: any) {
  const prodProps = new Map(prodObj.properties.map((p: any) => [p.key.name || p.key.value, p]))

  for (const prop of devObj.properties) {
    const key = prop.key.name || prop.key.value
    if (prodProps.has(key)) {
      // 替换 prod 中的同名 key
      const index = prodObj.properties.indexOf(prodProps.get(key))
      if (index >= 0)
        prodObj.properties[index] = prop
    }
    else {
      // 不同名，直接添加
      prodObj.properties.push(prop)
    }
  }
}

/**
 * 生成脚本
 * @param options - 解析的选项
 * @param mode - 模式，可以是'serve'或'build'
 * @returns 返回一个Promise，其值为GenerateScript对象
 */
export async function generateScript(options: DeepRequired<ResolvedOptions>, mode: 'serve' | 'build', base: string): Promise<GenerateScript> {
  const { dir, fileName, globalName, serve, build } = options.env
  const folder = await findFolder(process.cwd(), dir)
  const files = await fg('*.+(js|ts)', {
    absolute: true,
    cwd: folder,
  })
  // build or serve RegExp
  const testReg = mode === 'serve' ? serve : build
  let target = ''
  let source = ''
  let code = ''
  const name = fileName

  for (const file of files) {
    try {
      const mod = await fs.readFile(file, 'utf-8')
      if (testReg?.test(file))
        target = mod

      else
        source = mod
    }
    catch (error) {
      // Handle errors here if needed
      console.error(`Error loading file ${file}:`, error)
    }
  }
  const targetAst = recast.parse(target)
  const sourceAst = recast.parse(source)
  const targetExport = targetAst.program.body.find((n: any) => n.type === 'ExportDefaultDeclaration').declaration
  const sourceExport = sourceAst.program.body.find((n: any) => n.type === 'ExportDefaultDeclaration').declaration
  mergeObjects(sourceExport, targetExport)
  // 重新生成代码（自动保留注释）
  const mergedCode = recast.print(sourceExport).code
  const returnedTarget = mergedCode
  const versionInfo = await generateVersion(options, mode)
  code = `window.${globalName}=${returnedTarget};\n${versionInfo}`
  const formatCode = code
  return {
    code,
    script: `  <script type="text/javascript" src="${base}${fileName}"></script>\n</head>`,
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
  const pkg = await getPackageInfo(process.cwd())
  // 加入版本信息
  return `console.info("Version: %c${pkg?.version}%c -  ${mode === 'serve' ? 'runtime' : 'built'} on %c${options.date}%c", "color: green;", '', "color: blue;", '')`
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
