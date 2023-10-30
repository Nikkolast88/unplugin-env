import path, { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import fg from 'fast-glob'
import { loadFile } from 'magicast'
import { deepMerge } from '@antfu/utils'

import { format } from 'prettier'
import type { GenerateScript, ResolvedOptions } from '../types'

// external link or runtime
export async function generateScript(options: ResolvedOptions, mode: 'serve' | 'build'): Promise<GenerateScript> {
  const { dir, fileName, globalName, serve, build } = options.env
  const folder = await findFolder(process.cwd(), dir || '')
  const files = await fg('*.+(js|ts)', {
    absolute: true,
    cwd: folder,
  })
  // build or serve RegExp
  const testReg = mode === 'serve' ? serve : build
  let target = {}
  const source = []
  let code = ''
  const name = fileName || ''

  for (const file of files) {
    const mod = await loadFile(file)
    if (testReg?.test(file))
      target = mod.exports.default

    else
      source.push(mod.exports.default)
  }
  const returnedTarget = deepMerge({}, source, target)
  const versionInfo = await generateVersion(options, mode)
  code = `window.${globalName}=${JSON.stringify(returnedTarget)};${versionInfo}`
  const formatCode = await format(code, { parser: 'babel' })
  return {
    code,
    script: `  <script type="text/javascript" src="${fileName}"></script>\n</head>`,
    emit: {
      type: 'asset',
      fileName: name,
      source: formatCode,
    },
    watchFolder: path.resolve(folder),
  }
}

// version
async function generateVersion(options: ResolvedOptions, mode: 'serve' | 'build') {
  const packageFile = await fg('package.json', {
    absolute: true,
    cwd: resolve(process.cwd()),
  })
  const packageString = await fs.readFile(packageFile[0], 'utf8')
  const packageJson = JSON.parse(packageString)
  return `console.info("Version: ${packageJson.version} -  ${mode === 'serve' ? 'runtime' : 'built'} on ${options.date}")`
}

async function findFolder(directoryPath: string, dir: string): Promise<string> {
  const ignore = ['dist', 'node_modules', 'playground', 'example', 'test', 'jest', 'tests', 'locales', 'public', '.git', '.github', '.vscode']
  let files = await fs.readdir(directoryPath)
  files = files.filter((item: string) => !ignore.includes(item))
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const filePath = path.join(directoryPath, file)
    const stat = await fs.stat(filePath)
    if (stat.isDirectory()) {
      if (file.toLowerCase() === dir) {
        return filePath
      }
      else {
        const nested = await findFolder(filePath, dir)
        if (nested)
          return nested
      }
    }
  }
  return ''
}
