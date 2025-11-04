# unplugin-env

[![NPM version](https://img.shields.io/npm/v/unplugin-env?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-env)
[![CI](https://github.com/Nikkolast88/unplugin-env/actions/workflows/ci.yml/badge.svg)](https://github.com/Nikkolast88/unplugin-env/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/unplugin-env)](https://www.npmjs.com/package/unplugin-env)
[![License](https://img.shields.io/npm/l/unplugin-env)](./LICENSE)

[unplugin](https://github.com/unjs/unplugin) 的入门模板。

[English](./README.md) | 简体中文

## 系统要求

- **Node.js**: `^20.19.0 || >=22.12.0`
- **包管理器**: `pnpm >= 9.0.0` (推荐)
- **浏览器支持**:
  - Chrome >= 109
  - Firefox >= 115
  - Safari >= 15.6
  - Edge >= 109
  - 不支持 IE 11

## 模板使用

使用以下命令克隆此模板：

```bash
npx degit nikkolast88/unplugin-env my-unplugin
```

然后全局替换 `unplugin-env` 为你的插件名称。

接下来你就可以开始开发你的 unplugin 了 🔥

测试插件，运行：`pnpm run dev`
发布新版本，运行：`pnpm run release`

## 安装

> **注意**: 需要 Node.js `^20.19.0` 或 `>=22.12.0`

```bash
npm i unplugin-env
```

### 使用 pnpm（推荐）

```bash
pnpm add unplugin-env
```

### 使用 yarn

```bash
yarn add unplugin-env
```

## 使用方法

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import Starter from 'unplugin-env/vite'

export default defineConfig({
  plugins: [
    Starter({ /* 选项 */ }),
  ],
})
```

示例：[`playground/`](./playground/)

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import Starter from 'unplugin-env/rollup'

export default {
  plugins: [
    Starter({ /* 选项 */ }),
  ],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-env/webpack')({ /* 选项 */ })
  ]
}
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default {
  buildModules: [
    ['unplugin-env/nuxt', { /* 选项 */ }],
  ],
}
```

> 此模块同时支持 Nuxt 2 和 [Nuxt Vite](https://github.com/nuxt/vite)

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-env/webpack')({ /* 选项 */ }),
    ],
  },
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from 'esbuild'
import Starter from 'unplugin-env/esbuild'

build({
  plugins: [Starter()],
})
```

<br></details>

## 系统要求详情

### 运行环境

| 环境 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Node.js | `^20.19.0` 或 `>=22.12.0` | 最新 LTS 版本 |
| pnpm | `>=9.0.0` | `9.15.4+` |
| npm | `>=9.0.0` | 最新版本 |
| yarn | `>=3.0.0` | 最新版本 |

### 浏览器支持

此插件生成的代码可在现代浏览器中运行：

- ✅ Chrome/Edge >= 109
- ✅ Firefox >= 115
- ✅ Safari >= 15.6
- ❌ Internet Explorer 11（不支持）

### 构建工具兼容性

| 工具 | 版本 | 状态 |
|------|------|------|
| Vite | `>=5.0.0` | ✅ 完全支持 |
| Webpack | `^4` 或 `^5` | ✅ 完全支持 |
| Rollup | `>=3.0.0` | ✅ 完全支持 |
| esbuild | `>=0.15.0` | ✅ 完全支持 |
| Nuxt | `^3` 或 `^4` | ✅ 完全支持 |

### 为什么有这些要求？

- **Node.js 20.19+**：Vite 7 和 ESLint 9 的必需版本
- **现代浏览器**：插件使用 ES6+ 特性（不对 IE11 进行转译）
- **pnpm 9+**：针对 Node.js 20 优化，具有更好的性能和 workspace 支持

## 开发指南

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/nikkolast88/unplugin-env.git
cd unplugin-env

# 安装依赖（推荐使用 pnpm）
pnpm install

# 启动开发模式
pnpm run dev

# 在 playground 中测试
pnpm run play
```

### 可用脚本

- `pnpm run build` - 构建生产版本
- `pnpm run dev` - 启动开发模式（监听文件变化）
- `pnpm run play` - 在 playground 中测试插件
- `pnpm run lint` - 运行代码检查
- `pnpm run test` - 运行测试
- `pnpm run release` - 发布新版本

### 项目结构

```
unplugin-env/
├── src/               # 源代码
│   ├── core/          # 核心功能
│   ├── index.ts       # 主入口
│   ├── vite.ts        # Vite 插件
│   ├── webpack.ts     # Webpack 插件
│   ├── rollup.ts      # Rollup 插件
│   ├── esbuild.ts     # esbuild 插件
│   └── nuxt.ts        # Nuxt 模块
├── playground/        # 测试项目
├── test/              # 测试文件
└── dist/              # 构建输出
```

## 许可证

MIT License © 2023-PRESENT [Nikkolast88]
