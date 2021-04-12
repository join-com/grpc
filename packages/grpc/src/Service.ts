import * as grpc from '@grpc/grpc-js'

export interface ServiceMapping<
  ServiceDefinitionType extends grpc.ServiceDefinition = grpc.ServiceDefinition,
  ServiceImplementationType extends grpc.UntypedServiceImplementation = grpc.UntypedServiceImplementation
> {
  definition: ServiceDefinitionType
  implementation: ServiceImplementationType
}

// We replicate the grpc internal type because for some reason they don't export
// it, although it's trivial to construct, so it's not them trying to hide
// implementation details.
type HandleCall<RequestType, ResponseType> =
  | grpc.handleUnaryCall<RequestType, ResponseType>
  | grpc.handleClientStreamingCall<RequestType, ResponseType>
  | grpc.handleServerStreamingCall<RequestType, ResponseType>
  | grpc.handleBidiStreamingCall<RequestType, ResponseType>

type HandleStreamCall<RequestType, ResponseType> =
  | grpc.handleClientStreamingCall<RequestType, ResponseType>
  | grpc.handleServerStreamingCall<RequestType, ResponseType>
  | grpc.handleBidiStreamingCall<RequestType, ResponseType>

type GrpcCall<RequestType, ResponseType> =
  | grpc.ServerUnaryCall<RequestType, ResponseType>
  | grpc.ServerReadableStream<RequestType, ResponseType>
  | grpc.ServerWritableStream<RequestType, ResponseType>
  | grpc.ServerDuplexStream<RequestType, ResponseType>

type GrpcStreamCall<RequestType, ResponseType> =
  | grpc.ServerReadableStream<RequestType, ResponseType>
  | grpc.ServerWritableStream<RequestType, ResponseType>
  | grpc.ServerDuplexStream<RequestType, ResponseType>

export type JoinGrpcHandler<
  RequestType = unknown,
  ResponseType = unknown,
  Callback extends undefined | grpc.sendUnaryData<ResponseType> = undefined
> = (
  requestWrapper: GrpcCall<RequestType, ResponseType>,
  callback?: Callback,
) => Callback extends undefined ? Promise<ResponseType> : void

export interface JoinServiceImplementation {
  [key: string]: JoinGrpcHandler
}

export class Service<
  ServiceDefinitionType extends grpc.ServiceDefinition = grpc.ServiceDefinition,
  ServiceImplementationType extends grpc.UntypedServiceImplementation = grpc.UntypedServiceImplementation
> implements ServiceMapping<ServiceDefinitionType, ServiceImplementationType> {
  public readonly implementation: ServiceImplementationType

  constructor(
    public readonly definition: ServiceDefinitionType,
    implementation: JoinServiceImplementation,
  ) {
    this.implementation = this.adaptImplementation(implementation)
  }

  private adaptImplementation(
    promisifiedImplementation: JoinServiceImplementation,
  ): ServiceImplementationType {
    return Object.entries(promisifiedImplementation).reduce(
      (acc, [name, handler]) => {
        // Obtaining definition
        const methodDefinition = this.definition[name]
        if (!methodDefinition) {
          throw new Error('Unable to find method definition')
        }

        // Inspecting definition
        const isClientStream =
          !methodDefinition.responseStream && methodDefinition.requestStream
        const isUnary =
          !methodDefinition.responseStream && !methodDefinition.requestStream

        // Inspecting implementation
        const hasCallback = handler.length === 2

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let newHandler: HandleCall<any, any> // TODO: Refine these evil anys, or used the exported "untyped" version

        if ((isClientStream || isUnary) && !hasCallback) {
          newHandler = this.adaptPromiseHandler(handler)
        } else if (!methodDefinition.responseStream) {
          newHandler = this.adaptCallbackHandler(
            (handler as unknown) as JoinGrpcHandler<
              unknown,
              unknown,
              grpc.sendUnaryData<unknown> // The assertion on this one is implicit in the if-else condition
            >,
          )
        } else {
          newHandler = this.adaptStreamHandler(
            handler as (
              call: GrpcStreamCall<unknown, unknown>,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...args: any[]
            ) => void, // The assertion on this one is implicit in the if-else condition
          )
        }

        return {
          ...acc,
          [name]: newHandler, // TODO: add conditional logging & tracing
        }
      },
      {} as ServiceImplementationType, // It's safer to do the static cast here than on the whole result
    )
  }

  private adaptPromiseHandler<RequestType, ResponseType>(
    handler: JoinGrpcHandler<RequestType, ResponseType>,
  ): grpc.handleUnaryCall<RequestType, ResponseType> {
    return async (
      call: GrpcCall<RequestType, ResponseType>,
      callback: grpc.sendUnaryData<ResponseType>,
    ): Promise<void> => {
      try {
        const result = await handler(call)
        callback(null, result)
      } catch (e) {
        // TODO: Handle error
      }
    }
  }

  private adaptCallbackHandler<RequestType, ResponseType>(
    handler: JoinGrpcHandler<
      RequestType,
      ResponseType,
      grpc.sendUnaryData<ResponseType>
    >,
  ): grpc.handleUnaryCall<RequestType, ResponseType> {
    return (
      call: GrpcCall<RequestType, ResponseType>,
      callback: grpc.sendUnaryData<ResponseType>,
    ): void => {
      const callbackWrapper = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        err: any,
        result?: ResponseType | null,
        trailer?: grpc.Metadata,
        flags?: number,
      ) => {
        // TODO: add logging/tracing
        callback(err, result, trailer, flags)
      }
      handler(call, callbackWrapper)
    }
  }

  private adaptStreamHandler<RequestType, ResponseType>(
    handler: (
      call: GrpcStreamCall<RequestType, ResponseType>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => void,
  ): HandleStreamCall<RequestType, ResponseType> {
    return (
      call: GrpcStreamCall<RequestType, ResponseType>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => {
      // TODO: add logging/tracing
      handler(call, ...args)
    }
  }
}
