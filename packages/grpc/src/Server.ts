import * as grpc from '@grpc/grpc-js'
import { IServer } from './interfaces/IServer'

export interface Logger {
  info(message: string, payload?: unknown): void
}

export async function bindServer(
  server: grpc.Server,
  host: string,
  credentials: grpc.ServerCredentials,
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    server.bindAsync(host, credentials, (error, port) => {
      if (error) {
        reject(error)
      } else {
        resolve(port)
      }
    })
  })
}

export class Server implements IServer {
  public readonly server: grpc.Server
  public port?: number

  constructor(
    private readonly credentials: grpc.ServerCredentials = grpc.ServerCredentials.createInsecure(),
    private readonly logger?: Logger,
  ) {
    this.server = new grpc.Server()
  }

  public async start(host: `${string}:${number}`): Promise<void> {
    const [hostName] = host.split(':')
    if (hostName === undefined) {
      throw new Error(`Invalid host (${host})`)
    }

    this.port = await bindServer(this.server, host, this.credentials)

    if (this.port === 0) {
      throw Error(`Can not connect to host (${host})`)
    }
    if (this.logger) {
      this.logger.info(`grpc server is listening on ${hostName}:${this.port}`)
    }
    this.server.start()
  }

  public tryShutdown(): Promise<void> {
    return new Promise<void>((resolve, reject) =>
      this.server.tryShutdown((error) => (error ? reject(error) : resolve())),
    )
  }
}
