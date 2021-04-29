import { Metadata, status } from '@grpc/grpc-js'

export class ClientError extends Error {
  [key: string]: unknown

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
  }
}
