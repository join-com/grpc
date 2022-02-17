import * as grpc from '@grpc/grpc-js'

export interface IServiceErrorHandler {
  mapGrpcStatusCode(error: Error): grpc.status
  formatError?(error: Error): Error
}
