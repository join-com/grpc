import * as grpc from '@grpc/grpc-js'
import {
  ClientStreamRequest,
  IClient,
  MethodName,
  UnaryRequest,
} from './interfaces/IClient'
import { IClientConfig } from './interfaces/IClientConfig'

// We compute this type instead of importing it because it's not directly exposed
type GrpcServiceClient = InstanceType<
  ReturnType<typeof grpc.makeGenericClientConstructor>
>

export class Client<ServiceDefinitionType = grpc.UntypedServiceImplementation>
  implements IClient<ServiceDefinitionType> {
  /** WARNING: Access this property from outside only for debugging/tracing/profiling purposes */
  public readonly client: GrpcServiceClient

  constructor(
    /** WARNING: Access this property from outside only for debugging/tracing/profiling purposes */
    public readonly config: IClientConfig<ServiceDefinitionType>,
  ) {
    // Don't lose time trying to see if the third parameter (classOptions) is useful for anything. It's not.
    // The current implementation of grpc.makeGenericClientConstructor does absolutely nothing with it.
    const ClientClass = grpc.makeGenericClientConstructor(
      this.config.serviceDefinition,
      this.config.serviceName,
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
    method: MethodName<ServiceDefinitionType>,
    metadata?: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<RequestType, ResponseType> {
    const serviceDefs = this.config.serviceDefinition[method]
    const serialize = serviceDefs.requestSerialize
    const deserialize = serviceDefs.responseDeserialize

    return this.client.makeBidiStreamRequest(
      method,
      serialize,
      deserialize,
      metadata ?? new grpc.Metadata(), // TODO: Fill metadata?
      options ?? {},
    )
  }

  public makeClientStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceDefinitionType>,
    metadata?: grpc.Metadata,
    options?: grpc.CallOptions,
  ): ClientStreamRequest<RequestType, ResponseType> {
    const serviceDefs = this.config.serviceDefinition[method]
    const serialize = serviceDefs.requestSerialize
    const deserialize = serviceDefs.responseDeserialize

    let call: grpc.ClientWritableStream<RequestType> | undefined
    const res = new Promise<ResponseType>((resolve, reject) => {
      call = this.client.makeClientStreamRequest(
        method,
        serialize,
        deserialize,
        metadata ?? new grpc.Metadata(), // TODO: Fill metadata?
        options ?? {},
        this.createCallback(resolve, reject),
      )
    })

    // We can assert that call won't be undefined because the promise executor runs at construction time
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { call: call!, res }
  }

  public makeServerStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceDefinitionType>,
    argument: RequestType,
    metadata?: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientReadableStream<ResponseType> {
    const serviceDefs = this.config.serviceDefinition[method]
    const serialize = serviceDefs.requestSerialize
    const deserialize = serviceDefs.responseDeserialize

    return this.client.makeServerStreamRequest(
      method,
      serialize,
      deserialize,
      argument,
      metadata ?? new grpc.Metadata(), // TODO: Fill metadata?
      options ?? {},
    )
  }

  public makeUnaryRequest<RequestType, ResponseType>(
    method: MethodName<ServiceDefinitionType>,
    argument: RequestType,
    metadata?: grpc.Metadata,
    options?: grpc.CallOptions,
  ): UnaryRequest<ResponseType> {
    const serviceDefs = this.config.serviceDefinition[method]
    const serialize = serviceDefs.requestSerialize
    const deserialize = serviceDefs.responseDeserialize

    let call: grpc.ClientUnaryCall | undefined
    const res = new Promise<ResponseType>((resolve, reject) => {
      call = this.client.makeUnaryRequest<RequestType, ResponseType>(
        method,
        serialize,
        deserialize,
        argument,
        metadata ?? new grpc.Metadata(), // TODO: Fill metadata?
        options ?? {},
        this.createCallback(resolve, reject),
      )
    })

    // We can assert that call won't be undefined because the promise executor runs at construction time
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { call: call!, res }
  }

  private createCallback<ResponseType>(
    resolve: (value: ResponseType | PromiseLike<ResponseType>) => void,
    reject: (value?: unknown) => void,
  ) {
    return (err: grpc.ServiceError | null, value?: ResponseType) => {
      if (err) {
        return reject(err) // TODO: Adapt error type?
      }
      if (value === undefined) {
        // This branch should be unreachable
        return reject(new Error('response value not available'))
      }
      resolve(value)
    }
  }
}
