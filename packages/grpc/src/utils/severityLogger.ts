import { INoDebugLogger } from '..'
import { LogSeverity } from '../types/LogSeverity'

export const severityLogger = (logger?: INoDebugLogger) => ({
  log: (severity: LogSeverity, message: string, payload: unknown) => {
    if (!logger) {
      return
    }

    switch (severity) {
      case 'INFO':
        return logger.info(message, payload)
      case 'WARNING':
        return logger.warn(message, payload)
      case 'ERROR':
        return logger.error(message, payload)
    }
  },
})
