import * as grpc from '@grpc/grpc-js'

export interface IServer {
  readonly server: grpc.Server

  start(host: `${string}:${string}`): Promise<void>
  tryShutdown(): Promise<void>
}
