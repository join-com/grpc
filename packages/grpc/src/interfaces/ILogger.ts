export type Severity = 'INFO' | 'WARN' | 'ERROR'

export interface IGeneralLogger {
  log(severity: Severity, message: string, payload?: unknown): void
}

export interface IInfoLogger {
  info(message: string, payload?: unknown): void
}

export interface IErrorLogger {
  error(message: string, payload?: unknown): void
}

export interface IWarnLogger {
  warn(message: string, payload?: unknown): void
}

export type INoDebugLogger = IInfoLogger & IErrorLogger & IWarnLogger & IGeneralLogger
