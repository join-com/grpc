import * as grpc from '@grpc/grpc-js'
import { IServiceMapping } from './IServiceMapping'

export interface IServer {
  readonly server: grpc.Server

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addService(serviceMapping: IServiceMapping<any>): void
  start(host: `${string}:${string}`): Promise<void>
  tryShutdown(): Promise<void>
}
