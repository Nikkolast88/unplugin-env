import chalk from 'chalk'

// eslint-disable-next-line no-console
const log = console.log

export class Log {
  static log(msg: string) {
    log(chalk.bold(msg))
  }

  static error(msg: string) {
    log(chalk.bold.red(msg))
  }

  static success(msg: string) {
    log(chalk.bold.green(msg))
  }
}
