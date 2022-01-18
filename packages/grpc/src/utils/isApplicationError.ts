import { ApplicationError } from '../types/ApplicationError'

export const isApplicationError = (err: unknown): err is ApplicationError => {
  if (!(err instanceof Error)) {
    return false
  }

  if (hasOwnProperty(err, 'type')) {
    return err.type === 'ApplicationError'
  }

  return false
}

const hasOwnProperty = <T, K extends string>(obj: T, property: K): obj is T & { [property in K]: unknown } => {
  return property in obj
}
