import * as grpc from '@grpc/grpc-js'
import { Chronometer, IChronometer } from './Chronometer'
import { ClientError } from './ClientError'
import {
  IBidiStreamRequest,
  IClient,
  IClientStreamRequest,
  IServerStreamRequest,
  IUnaryRequest,
  MethodName,
} from './interfaces/IClient'
import { IClientConfig } from './interfaces/IClientConfig'
import { INoDebugLogger } from './interfaces/ILogger'
import { IClientTrace } from './interfaces/ITrace'

// We compute this type instead of importing it because it's not directly exposed
type GrpcServiceClient = InstanceType<ReturnType<typeof grpc.makeGenericClientConstructor>>

export abstract class Client<
  ServiceImplementationType = grpc.UntypedServiceImplementation,
  ServiceNameType extends string = string,
> implements IClient<ServiceImplementationType, ServiceNameType>
{
  /** WARNING: Access this property from outside only for debugging/tracing/profiling purposes */
  public readonly client: GrpcServiceClient
  protected readonly logger?: INoDebugLogger
  private readonly trace?: IClientTrace

  protected constructor(
    /** WARNING: Access this property from outside only for debugging/tracing/profiling purposes */
    public readonly config: IClientConfig<ServiceImplementationType>,
    public readonly serviceName: ServiceNameType,
  ) {
    this.logger = config.logger
    this.trace = config.trace

    // Don't lose time trying to see if the third parameter (classOptions) is useful for anything. It's not.
    // The current implementation of grpc.makeGenericClientConstructor does absolutely nothing with it.
    const ClientClass = grpc.makeGenericClientConstructor(this.config.serviceDefinition, this.serviceName, {})
    this.client = new ClientClass(this.config.address, this.config.credentials, this.config.options)
  }

  public close(): void {
    this.client.close()
  }

  public makeBidiStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): IBidiStreamRequest<RequestType, ResponseType> {
    const call = this.makeRequest(method, this.prepareMetadata(metadata), options ?? {}) as grpc.ClientDuplexStream<
      RequestType,
      ResponseType
    >

    return { call }
  }

  public makeClientStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): IClientStreamRequest<RequestType, ResponseType> {
    const chronometer = new Chronometer()

    let call: grpc.ClientWritableStream<RequestType> | undefined
    const methodPath = `/${this.serviceName}/${method}`
    const res = new Promise<ResponseType>((resolve, reject) => {
      call = this.makeRequest(
        method,
        this.prepareMetadata(metadata),
        options ?? {},
        this.createCallback(resolve, reject, methodPath, chronometer),
      ) as grpc.ClientWritableStream<RequestType>
    })

    // We can assert that call won't be undefined because the promise executor runs at construction time
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { call: call!, res }
  }

  public makeServerStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    argument: RequestType,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): IServerStreamRequest<ResponseType> {
    const call = this.makeRequest(
      method,
      argument,
      this.prepareMetadata(metadata),
      options ?? {},
    ) as grpc.ClientReadableStream<ResponseType>

    return { call }
  }

  public makeUnaryRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    argument: RequestType,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): IUnaryRequest<ResponseType> {
    const chronometer = new Chronometer()

    let call: grpc.ClientUnaryCall | undefined

    const methodPath = `/${this.serviceName}/${method}`
    const res = new Promise<ResponseType>((resolve, reject) => {
      call = this.makeRequest(
        method,
        argument,
        this.prepareMetadata(metadata),
        options ?? {},
        this.createCallback(resolve, reject, methodPath, chronometer, argument),
      ) as grpc.ClientUnaryCall
    })

    // We can assert that call won't be undefined because the promise executor runs at construction time
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { call: call!, res }
  }

  private createCallback<RequestType, ResponseType>(
    resolve: (value: ResponseType | PromiseLike<ResponseType>) => void,
    reject: (value?: unknown) => void,
    methodPath: string,
    chronometer: IChronometer,
    request?: RequestType,
  ) {
    return (error: grpc.ServiceError | null, value?: ResponseType) => {
      if (error) {
        const patchedError = this.convertError(error, methodPath)

        const logData = {
          latency: chronometer.getEllapsedTime(),
          request,
          error: patchedError,
        }

        if (error.code === grpc.status.NOT_FOUND) {
          // We don't mark "not found" as an error in our logs
          this.logger?.info(`GRPC Client ${methodPath}`, logData)
        } else if (patchedError.code === 'validation') {
          this.logger?.warn(`GRPC Client ${methodPath}`, logData)
        } else {
          this.logger?.error(`GRPC Client ${methodPath}`, logData)
        }

        return reject(patchedError)
      }

      if (value === undefined) {
        // This branch should be unreachable
        return reject(new Error('response value not available'))
      }

      this.logger?.info(`GRPC Client ${methodPath}`, {
        latency: chronometer.getEllapsedTime(),
        request,
      })
      resolve(value)
    }
  }

  private convertError(error: grpc.ServiceError, methodPath: string): ClientError {
    return this.handleMetaError(error.metadata ?? new grpc.Metadata(), methodPath, error.code, error.message)
  }

  private handleMetaError(
    metadata: grpc.Metadata,
    methodPath: string,
    grpcCode?: grpc.status,
    message?: string,
  ): ClientError {
    const metadataBinaryError = metadata.get('error-bin')
    const errorJSON = JSON.parse(metadataBinaryError[0]?.toString() ?? '{}') as Record<string, unknown>

    return new ClientError(methodPath, metadata, errorJSON, grpcCode, message)
  }

  private prepareMetadata(metadata?: Record<string, string>): grpc.Metadata {
    const preparedMetadata = new grpc.Metadata()

    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        preparedMetadata.set(key, value)
      }
    }

    if (this.trace) {
      const traceId = this.trace.getTraceContext()
      if (traceId) {
        preparedMetadata.add(this.trace.getTraceContextName(), traceId)
      }
    }

    return preparedMetadata
  }

  /** This is a temporary solution and proper types will be added later
   * this.client instance created with service definition already includes the set of specific grpc service methods.
   * and can be called like this.client.Check(). Check method is decorated makeUnaryRequest method which already passes
   * path, serialize, deserialize parameters.
   * https://github.com/grpc/grpc-node/blob/aeb42733d861883b82323e2dc6d1aba0e3a12aa0/packages/grpc-js/src/make-client.ts#L158
   * https://github.com/grpc/grpc-node/blob/aeb42733d861883b82323e2dc6d1aba0e3a12aa0/packages/grpc-js/src/make-client.ts#L178
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private makeRequest(method: MethodName<ServiceImplementationType>, ...args: unknown[]): any {
    return this.client[method]?.call(this.client, ...args)
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
