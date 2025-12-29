'use strict'
import { fileURLToPath } from 'node:url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import Unplugin from '../src/webpack.ts'

const entryPath = fileURLToPath(new URL('./main.js', import.meta.url))
const outputDir = fileURLToPath(new URL('./webpack-dist', import.meta.url))

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'production',
  target: 'web',
  entry: entryPath,
  output: {
    path: outputDir,
    filename: 'index.js',
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    Unplugin(),
  ],
}

export default config
