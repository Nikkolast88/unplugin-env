import chalk from 'chalk'

// eslint-disable-next-line no-console
const log = console.log

export class Log {
  static log(key: string, msg: unknown) {
    log(chalk.bold(`${key}: ${msg}`))
  }

  static error(key: string, msg: unknown) {
    log(chalk.bold.red(`${key}: ${msg}`))
  }

  static success(key: string, msg: unknown) {
    log(chalk.bold.green(`${key}: ${msg}`))
  }
}
