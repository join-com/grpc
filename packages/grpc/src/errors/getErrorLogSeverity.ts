import { Severity } from '../interfaces/ILogger'
import { isApplicationError } from './isApplicationError'

export function getErrorLogSeverity(error: Error): Severity {
  if (isApplicationError(error)) {
    return error.code === 'unknown' ? 'WARN' : 'INFO'
  }

  if (error.name === 'EntityNotFound') {
    return 'INFO'
  }

  return 'ERROR'
}
