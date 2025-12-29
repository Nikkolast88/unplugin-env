import type { DeepRequired, GenerateScript, ResolvedOptions } from '../types'
import type { UnifiedContext } from './options'
import { execSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import fg from 'fast-glob'
import * as recast from 'recast'

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
 * @param context - 统一上下文
 * @returns 返回一个Promise，其值为GenerateScript对象
 */
export async function generateScript(options: DeepRequired<ResolvedOptions>, context: UnifiedContext): Promise<GenerateScript> {
  const { dir, fileName, globalName, serve, build } = options.env
  const folder = await findFolder(process.cwd(), dir)
  const files = await fg('*.+(js|ts)', {
    absolute: true,
    cwd: folder,
  })
  const { mode, base } = context
  // build or serve RegExp
  const testReg = mode === 'dev' ? serve : build
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
  const viteIgnoreAttr = context.framework === 'vite' ? ' vite-ignore' : ''
  return {
    code,
    script: `  <script type="text/javascript"${viteIgnoreAttr} src="${base}${fileName}"></script>\n</head>`,
    emit: {
      type: 'asset',
      fileName: name,
      source: formatCode,
    },
    watchFiles: files,
  }
}

async function getFullPackageJson(cwd = process.cwd()) {
  const pkgPath = path.resolve(cwd, 'package.json')
  const content = await fs.readFile(pkgPath, 'utf-8')
  return JSON.parse(content)
}

function wrapText(text: string, maxLen: number): string[] {
  const lines: string[] = []
  let current = ''

  for (const char of text) {
    current += char
    if (current.length >= maxLen) {
      lines.push(current)
      current = ''
    }
  }

  if (current)
    lines.push(current)

  return lines
}

/**
 * 生成版本信息
 * @param options - 解析的选项
 * @param mode - 模式，可以是'dev'或'build'
 * @returns 返回版本信息的字符串
 */
async function generateVersion(
  options: ResolvedOptions,
  mode: UnifiedContext['mode'],
): Promise<string> {
  const pkg = await getFullPackageJson(process.cwd())

  const name = pkg?.name ?? 'Unknown App'
  const version = `v${pkg?.version ?? '0.0.0'}`
  const branchName = getBranchName() || 'unknown'
  const commitHash = getCommitHash() || 'unknown'
  const datetime = options.datetime
  const stateLabel = mode === 'dev' ? 'runtime' : 'built'
  const stateColor = mode === 'dev' ? '#059669' : '#2563EB'

  // ===== Desc 自动换行 =====
  const MAX_DESC_LINE_LEN = 36
  const rawDesc = pkg?.description ?? 'unknown'
  const descLines = wrapText(rawDesc, MAX_DESC_LINE_LEN)

  // ===== 横线 =====
  const baseLines = [
    `${name}  ${version}  ${stateLabel}`,
    `Branch : ${branchName}`,
    `Commit : ${commitHash}`,
    `Time   : ${datetime}`,
    `Desc   : ${descLines[0]}`,
    ...descLines.slice(1).map(l => `         ${l}`),
  ]
  const maxLen = Math.max(...baseLines.map(l => l.length))
  const divider = '-'.repeat(maxLen + 4)

  // ===== console 文本 =====
  const textParts: string[] = [
    `${divider}\n`,
    ` ${name} `,
    ` ${version} `,
    ` ${stateLabel}\n`,
    `${divider}\n`,
    ` Branch :`,
    ` ${branchName}\n`,
    ` Commit :`,
    ` ${commitHash}\n`,
    ` Time   :`,
    ` ${datetime}\n`,
    ` Desc   :`,
    ` ${descLines[0]}\n`,
    ...descLines.slice(1).map(l => `          ${l}\n`),
    `${divider}`,
  ]

  // ===== 对应的 style =====
  const styles: string[] = [
    'color:#9CA3AF', // divider
    'color:#111827;font-weight:600', // name
    'color:#2563EB;font-weight:600', // version
    `color:${stateColor};font-weight:600`, // state
    'color:#9CA3AF', // divider

    'color:#6B7280', // Branch label
    'color:#111827',

    'color:#6B7280', // Commit label
    'color:#111827',

    'color:#6B7280', // Time label
    'color:#2563EB',

    'color:#6B7280', // Desc label
    'color:#4B5563',

    ...descLines.slice(1).map(() => 'color:#4B5563'),

    'color:#9CA3AF', // divider
  ]

  return `
console.log(
  ${JSON.stringify(`%c${textParts.join('%c')}`)},
  ${styles.map(s => JSON.stringify(s)).join(',\n  ')}
)
`.trim()
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

// 获取当前git分支名
function getBranchName(): string {
  const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  return branchName
}

// 获取当前分支最后一次提交hash，前八位
function getCommitHash(): string {
  const commitHash = execSync('git rev-parse HEAD').toString().trim()
  return commitHash.slice(0, 8)
}
