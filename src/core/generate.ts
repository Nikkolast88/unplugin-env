import type { DeepRequired, GenerateScript, ResolvedOptions } from '../types'
import type { UnifiedContext } from './options'
import { execSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import fg from 'fast-glob'
import * as recast from 'recast'
import tsParser from 'recast/parsers/typescript.js'

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
  const { configDir, emitFileName, emitDir, globalName, devMatch, buildMatch } = options.env
  const folder = await resolveConfigFolder(process.cwd(), configDir)
  if (!folder)
    throw new Error(`[unplugin-env] Config directory "${configDir}" not found from ${process.cwd()}`)
  const files = await fg('*.{js,ts}', {
    absolute: true,
    cwd: folder,
  })
  if (!files.length)
    throw new Error(`[unplugin-env] No config files found in ${folder}`)
  const { mode, base } = context
  // build or serve RegExp
  const testReg = mode === 'dev' ? devMatch : buildMatch
  let target = ''
  let source = ''
  let code = ''
  let targetFile = ''
  let sourceFile = ''
  const resolvedEmitFileName = resolveEmitFileName(emitDir, emitFileName)

  for (const file of files) {
    try {
      const mod = await fs.readFile(file, 'utf-8')
      if (testReg?.test(file)) {
        target = mod
        targetFile = file
      }
      else {
        source = mod
        sourceFile = file
      }
    }
    catch (error) {
      // Handle errors here if needed
      console.error(`Error loading file ${file}:`, error)
    }
  }
  if (files.length === 1) {
    if (!target) {
      target = source
      targetFile = sourceFile
    }
    if (!source) {
      source = target
      sourceFile = targetFile
    }
  }
  if (!target || !targetFile)
    throw new Error(`[unplugin-env] No file matched "${testReg}" in ${folder}`)
  if (!source || !sourceFile)
    throw new Error(`[unplugin-env] No base config file found in ${folder}`)
  const targetAst = parseConfig(target, targetFile)
  const sourceAst = parseConfig(source, sourceFile)
  const targetExport = getDefaultExportObject(targetAst, targetFile)
  const sourceExport = getDefaultExportObject(sourceAst, sourceFile)
  mergeObjects(sourceExport, targetExport)
  // 重新生成代码（自动保留注释）
  const mergedCode = recast.print(sourceExport).code
  const returnedTarget = mergedCode
  const versionInfo = await generateVersion(options, mode)
  code = `window.${globalName}=${returnedTarget};\n${versionInfo}`
  const formatCode = code
  const viteIgnoreAttr = context.framework === 'vite' ? ' vite-ignore' : ''
  const scriptSrc = joinBasePath(base, resolvedEmitFileName)
  return {
    code,
    script: `  <script type="text/javascript"${viteIgnoreAttr} src="${scriptSrc}"></script>\n</head>`,
    emit: {
      type: 'asset',
      fileName: resolvedEmitFileName,
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

function parseConfig(code: string, filePath: string) {
  const parser = filePath.endsWith('.ts') ? tsParser : undefined
  return parser ? recast.parse(code, { parser }) : recast.parse(code)
}

function getDefaultExportObject(ast: any, filePath: string) {
  const exportNode = ast?.program?.body?.find((node: any) => node.type === 'ExportDefaultDeclaration')
  if (!exportNode?.declaration)
    throw new Error(`[unplugin-env] ${filePath} must have a default export of an object`)
  let decl = exportNode.declaration
  if (decl.type === 'TSAsExpression' || decl.type === 'TSTypeAssertion')
    decl = decl.expression
  if (decl.type === 'CallExpression' && decl.arguments?.[0]?.type === 'ObjectExpression')
    decl = decl.arguments[0]
  if (decl.type !== 'ObjectExpression')
    throw new Error(`[unplugin-env] ${filePath} default export must be an object literal`)
  return decl
}

function joinBasePath(base: string, resourcePath: string) {
  const safeBase = base && base.endsWith('/') ? base : `${base || '/'}`.replace(/\/?$/, '/')
  const safeFile = resourcePath.replace(/^\/+/, '')
  return `${safeBase}${safeFile}`
}

function resolveEmitFileName(emitDir: string, emitFileName: string) {
  const normalizedFile = emitFileName.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!emitDir)
    return normalizedFile
  const normalizedDir = emitDir.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
  if (!normalizedDir)
    return normalizedFile
  const prefix = `${normalizedDir}/`
  if (normalizedFile === normalizedDir || normalizedFile.startsWith(prefix))
    return normalizedFile
  return path.posix.join(normalizedDir, normalizedFile)
}

async function resolveConfigFolder(root: string, configDir: string): Promise<string> {
  if (!configDir)
    return ''
  const candidate = path.isAbsolute(configDir) ? configDir : path.resolve(root, configDir)
  try {
    const stat = await fs.stat(candidate)
    if (stat.isDirectory())
      return candidate
  }
  catch {
    // fallback to recursive search
  }
  return findFolder(root, configDir)
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
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const dirLower = dir.toLowerCase()
  const filePaths = entries.filter(entry => !ignore.has(entry.name))
  let nestedFolder = ''
  for (const entry of filePaths) {
    if (!entry.isDirectory())
      continue
    const fullFilePath = path.join(directoryPath, entry.name)
    if (entry.name.toLowerCase() === dirLower)
      return fullFilePath
    nestedFolder = await findFolder(fullFilePath, dir)
    if (nestedFolder)
      return nestedFolder
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
