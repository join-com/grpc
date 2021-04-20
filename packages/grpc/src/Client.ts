import * as grpc from '@grpc/grpc-js'
import { Chronometer, IChronometer } from './Chronometer'
import {
  IClient,
  IClientStreamRequest,
  IUnaryRequest,
  MethodName,
} from './interfaces/IClient'
import { IErrorLogger, IInfoLogger } from './interfaces/ILogger'
import { IClientConfig } from './interfaces/IClientConfig'
import { IClientTrace } from './interfaces/ITrace'

// We compute this type instead of importing it because it's not directly exposed
type GrpcServiceClient = InstanceType<
  ReturnType<typeof grpc.makeGenericClientConstructor>
>

export abstract class Client<
  ServiceImplementationType = grpc.UntypedServiceImplementation,
  ServiceNameType extends string = string
> implements IClient<ServiceImplementationType, ServiceNameType> {
  /** WARNING: Access this property from outside only for debugging/tracing/profiling purposes */
  public readonly client: GrpcServiceClient
  private readonly logger?: IInfoLogger & IErrorLogger
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
    const ClientClass = grpc.makeGenericClientConstructor(
      this.config.serviceDefinition,
      this.serviceName,
      {},
    )
    this.client = new ClientClass(
      this.config.address,
      this.config.credentials,
      this.config.options,
    )
  }

  public close(): void {
    this.client.close()
  }

  public makeBidiStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<RequestType, ResponseType> {
    const serviceDefs = this.config.serviceDefinition[method]
    const serialize = serviceDefs.requestSerialize
    const deserialize = serviceDefs.responseDeserialize

    return this.client.makeBidiStreamRequest(
      `/${this.serviceName}/${method}`,
      serialize,
      deserialize,
      this.prepareMetadata(metadata),
      options ?? {},
    )
  }

  public makeClientStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): IClientStreamRequest<RequestType, ResponseType> {
    const chronometer = new Chronometer()

    const serviceDefs = this.config.serviceDefinition[method]
    const serialize = serviceDefs.requestSerialize
    const deserialize = serviceDefs.responseDeserialize

    let call: grpc.ClientWritableStream<RequestType> | undefined
    const methodPath = `/${this.serviceName}/${method}`
    const res = new Promise<ResponseType>((resolve, reject) => {
      call = this.client.makeClientStreamRequest(
        methodPath,
        serialize,
        deserialize,
        this.prepareMetadata(metadata),
        options ?? {},
        this.createCallback(resolve, reject, methodPath, chronometer),
      )
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
  ): grpc.ClientReadableStream<ResponseType> {
    const serviceDefs = this.config.serviceDefinition[method]
    const serialize = serviceDefs.requestSerialize
    const deserialize = serviceDefs.responseDeserialize

    return this.client.makeServerStreamRequest(
      `/${this.serviceName}/${method}`,
      serialize,
      deserialize,
      argument,
      this.prepareMetadata(metadata),
      options ?? {},
    )
  }

  public makeUnaryRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    argument: RequestType,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): IUnaryRequest<ResponseType> {
    const chronometer = new Chronometer()

    const serviceDefs = this.config.serviceDefinition[method]
    const serialize = serviceDefs.requestSerialize
    const deserialize = serviceDefs.responseDeserialize

    let call: grpc.ClientUnaryCall | undefined
    const methodPath = `/${this.serviceName}/${method}`
    const res = new Promise<ResponseType>((resolve, reject) => {
      call = this.client.makeUnaryRequest<RequestType, ResponseType>(
        methodPath,
        serialize,
        deserialize,
        argument,
        this.prepareMetadata(metadata),
        options ?? {},
        this.createCallback(resolve, reject, methodPath, chronometer, argument),
      )
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
        this.logger?.error(`GRPC Client ${methodPath}`, {
          latency: chronometer.getEllapsedTime(),
          request,
          error,
        })
        return reject(error) // TODO: Adapt error type?
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
}
