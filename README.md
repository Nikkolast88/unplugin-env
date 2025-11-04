# unplugin-env

[![NPM version](https://img.shields.io/npm/v/unplugin-env?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-env)
[![CI](https://github.com/Nikkolast88/unplugin-env/actions/workflows/ci.yml/badge.svg)](https://github.com/Nikkolast88/unplugin-env/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/unplugin-env)](https://www.npmjs.com/package/unplugin-env)
[![License](https://img.shields.io/npm/l/unplugin-env)](./LICENSE)

Starter template for [unplugin](https://github.com/unjs/unplugin).

English | [简体中文](./README.zh-CN.md)

## Requirements

- **Node.js**: `^20.19.0 || >=22.12.0`
- **Package Manager**: `pnpm >= 9.0.0` (recommended)
- **Browsers**:
  - Chrome >= 109
  - Firefox >= 115
  - Safari >= 15.6
  - Edge >= 109
  - No IE 11 support

## Template Usage

To use this template, clone it down using:

```bash
npx degit nikkolast88/unplugin-env my-unplugin
```

And do a global replace of `unplugin-env` with your plugin name.

Then you can start developing your unplugin 🔥

To test your plugin, run: `pnpm run dev`
To release a new version, run: `pnpm run release`

## Install

> **Note**: Requires Node.js `^20.19.0` or `>=22.12.0`

```bash
npm i unplugin-env
```

### Using pnpm (Recommended)

```bash
pnpm add unplugin-env
```

### Using yarn

```bash
yarn add unplugin-env
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import Starter from 'unplugin-env/vite'

export default defineConfig({
  plugins: [
    Starter({ /* options */ }),
  ],
})
```

Example: [`playground/`](./playground/)

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import Starter from 'unplugin-env/rollup'

export default {
  plugins: [
    Starter({ /* options */ }),
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
    require('unplugin-env/webpack')({ /* options */ })
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
    ['unplugin-env/nuxt', { /* options */ }],
  ],
}
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-env/webpack')({ /* options */ }),
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

## System Requirements

### Runtime Environment

| Environment | Minimum Version | Recommended |
|------------|-----------------|-------------|
| Node.js | `^20.19.0` or `>=22.12.0` | Latest LTS |
| pnpm | `>=9.0.0` | `9.15.4+` |
| npm | `>=9.0.0` | Latest |
| yarn | `>=3.0.0` | Latest |

### Browser Support

This plugin generates code that runs in modern browsers:

- ✅ Chrome/Edge >= 109
- ✅ Firefox >= 115
- ✅ Safari >= 15.6
- ❌ Internet Explorer 11 (not supported)

### Build Tool Compatibility

| Tool | Version | Status |
|------|---------|--------|
| Vite | `>=5.0.0` | ✅ Fully supported |
| Webpack | `^4` or `^5` | ✅ Fully supported |
| Rollup | `>=3.0.0` | ✅ Fully supported |
| esbuild | `>=0.15.0` | ✅ Fully supported |
| Nuxt | `^3` or `^4` | ✅ Fully supported |

### Why These Requirements?

- **Node.js 20.19+**: Required by Vite 7 and ESLint 9
- **Modern Browsers**: Plugin uses ES6+ features (no transpilation for IE11)
- **pnpm 9+**: Optimized for Node.js 20 with better performance and workspace support

## License

MIT License © 2023-PRESENT [Nikkolast88]
