import * as grpc from '@grpc/grpc-js'
import { INoDebugLogger } from './interfaces/ILogger'
import { IServer } from './interfaces/IServer'
import { IServiceMapping } from './interfaces/IServiceMapping'

export class Server implements IServer {
  public readonly server: grpc.Server

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _port?: number

  constructor(
    private readonly credentials: grpc.ServerCredentials = grpc.ServerCredentials.createInsecure(),
    private readonly logger?: INoDebugLogger,
  ) {
    this.server = new grpc.Server()
  }

  public get port(): number | undefined {
    return this._port
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addService(serviceMapping: IServiceMapping<any>): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.server.addService(serviceMapping.definition, serviceMapping.implementation)
  }

  public async start(host: `${string}:${number}`): Promise<void> {
    const [hostName] = host.split(':')
    if (hostName === undefined) {
      throw new Error(`Invalid host (${host})`)
    }

    this._port = await bindServer(this.server, host, this.credentials)

    if (this._port === 0) {
      throw Error(`Can not start gRPC server for host (${host})`)
    }

    this.logger?.info(`grpc server is listening on ${hostName}:${this._port}`)

    this.server.start()
  }

  public tryShutdown(): Promise<void> {
    return new Promise<void>((resolve, reject) => this.server.tryShutdown(error => (error ? reject(error) : resolve())))
  }

  public forceShutdown(): void {
    this.server.forceShutdown()
  }
}

export async function bindServer(
  server: grpc.Server,
  host: string,
  credentials: grpc.ServerCredentials,
): Promise<number> {
  return await new Promise<number>((resolve, _reject) => {
    server.bindAsync(host, credentials, (error, port) => {
      if (error){
        throw error
      }
      resolve(port)
    })
  })
}
