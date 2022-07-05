import { grpc, IServiceErrorHandler } from '@join-com/grpc'
import { isErrorWithCode } from './utils'

export const errorHandler: IServiceErrorHandler = {
  mapGrpcStatusCode(error: Error): grpc.status {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case 'validation':
        case 'invalidInput':
          return grpc.status.INVALID_ARGUMENT
        case 'notFound':
          return grpc.status.NOT_FOUND
        case 'conflict':
          return grpc.status.FAILED_PRECONDITION
      }
    }

    return grpc.status.UNKNOWN
  },
}
