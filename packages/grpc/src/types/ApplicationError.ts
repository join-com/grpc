import { ApplicationErrorCode } from './ApplicationErrorCode'

export type ApplicationError = Error & { type: 'ApplicationError'; code: ApplicationErrorCode }
