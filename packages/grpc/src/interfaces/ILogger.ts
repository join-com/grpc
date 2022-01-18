export interface IInfoLogger {
  info(message: string, payload?: unknown): void
}

export interface IErrorLogger {
  error(message: string, payload?: unknown): void
}

export interface IWarnLogger {
  warn(message: string, payload?: unknown): void
}

export type INoDebugLogger = IInfoLogger & IErrorLogger & IWarnLogger
