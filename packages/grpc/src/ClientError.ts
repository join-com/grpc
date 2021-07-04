import * as grpc from '@grpc/grpc-js'
import { Metadata, status } from '@grpc/grpc-js'

export class ClientError extends Error {
  [key: string]: unknown
  readonly code?: string

  constructor(
    public readonly methodPath: string,
    public readonly metadata: Metadata,
    errorJSON: Record<string, unknown>,
    public readonly grpcCode?: status,
    message?: string,
  ) {
    super(message)
    this.name = 'ClientError'
    Object.setPrototypeOf(this, new.target.prototype)
    Object.assign(this, { ...errorJSON })

    if (grpcCode === grpc.status.NOT_FOUND) {
      this.code = 'notFound'
    }
  }
}
