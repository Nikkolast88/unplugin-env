'use strict'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import Unplugin from '../src/webpack'

/** @type {import('webpack').Configuration} */
const config = {
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    Unplugin(),
  ],
}

export default config
