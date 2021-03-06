import * as grpc from '@grpc/grpc-js'
import { IInfoLogger } from './interfaces/ILogger'
import { IServer } from './interfaces/IServer'
import { IServiceMapping } from './interfaces/IServiceMapping'

export class Server implements IServer {
  public readonly server: grpc.Server
  private _port?: number

  constructor(
    private readonly credentials: grpc.ServerCredentials = grpc.ServerCredentials.createInsecure(),
    private readonly logger?: IInfoLogger,
  ) {
    this.server = new grpc.Server()
  }

  public get port(): number | undefined {
    return this._port
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addService(serviceMapping: IServiceMapping<any>): void {
    this.server.addService(
      serviceMapping.definition,
      serviceMapping.implementation,
    )
  }

  public async start(host: `${string}:${number}`): Promise<void> {
    const [hostName] = host.split(':')
    if (hostName === undefined) {
      throw new Error(`Invalid host (${host})`)
    }

    this._port = await bindServer(this.server, host, this.credentials)

    if (this._port === 0) {
      throw Error(`Can not connect to host (${host})`)
    }
    if (this.logger) {
      this.logger.info(`grpc server is listening on ${hostName}:${this._port}`)
    }
    this.server.start()
  }

  public tryShutdown(): Promise<void> {
    return new Promise<void>((resolve, reject) =>
      this.server.tryShutdown((error) => (error ? reject(error) : resolve())),
    )
  }
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
