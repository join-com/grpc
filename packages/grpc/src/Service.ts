import * as grpc from '@grpc/grpc-js'
import { Chronometer, IChronometer } from './Chronometer'

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

interface IInfoLogger {
  info(message: string, payload?: unknown): void
}

export class Service<
  ServiceDefinitionType extends grpc.ServiceDefinition = grpc.ServiceDefinition,
  ServiceImplementationType extends grpc.UntypedServiceImplementation = grpc.UntypedServiceImplementation
> implements ServiceMapping<ServiceDefinitionType, ServiceImplementationType> {
  public readonly implementation: ServiceImplementationType

  constructor(
    public readonly definition: ServiceDefinitionType,
    implementation: JoinServiceImplementation,
    private readonly logger?: IInfoLogger,
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
          newHandler = this.adaptPromiseHandler(handler, methodDefinition)
        } else if (!methodDefinition.responseStream) {
          newHandler = this.adaptCallbackHandler(
            (handler as unknown) as JoinGrpcHandler<
              unknown,
              unknown,
              grpc.sendUnaryData<unknown> // The assertion on this one is implicit in the if-else condition
            >,
            methodDefinition,
          )
        } else {
          newHandler = this.adaptStreamHandler(
            handler as (
              call: GrpcStreamCall<unknown, unknown>,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...args: any[]
            ) => void, // The assertion on this one is implicit in the if-else condition
            methodDefinition,
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
    methodDefinition: grpc.MethodDefinition<RequestType, ResponseType>,
  ): grpc.handleUnaryCall<RequestType, ResponseType> {
    return async (
      call: GrpcCall<RequestType, ResponseType>,
      callback: grpc.sendUnaryData<ResponseType>,
    ): Promise<void> => {
      const chronometer = new Chronometer()
      try {
        const result = await handler(call)
        this.logCall(methodDefinition, call, result, chronometer)
        callback(null, result)
      } catch (e) {
        this.logCall(methodDefinition, call, e, chronometer)
        handleError(e, callback)
      }
    }
  }

  private adaptCallbackHandler<RequestType, ResponseType>(
    handler: JoinGrpcHandler<
      RequestType,
      ResponseType,
      grpc.sendUnaryData<ResponseType>
    >,
    methodDefinition: grpc.MethodDefinition<RequestType, ResponseType>,
  ): grpc.handleUnaryCall<RequestType, ResponseType> {
    return (
      call: GrpcCall<RequestType, ResponseType>,
      callback: grpc.sendUnaryData<ResponseType>,
    ): void => {
      const chronometer = new Chronometer()
      const callbackWrapper = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        err: any,
        result?: ResponseType | null,
        trailer?: grpc.Metadata,
        flags?: number,
      ) => {
        this.logCall(
          methodDefinition,
          call,
          result as ResponseType,
          chronometer,
        )
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
    methodDefinition: grpc.MethodDefinition<RequestType, ResponseType>,
  ): HandleStreamCall<RequestType, ResponseType> {
    return (
      call: GrpcStreamCall<RequestType, ResponseType>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => {
      this.logCall(methodDefinition, call)
      handler(call, ...args)
    }
  }

  private logCall<RequestType, ResponseType>(
    methodDefinition: grpc.MethodDefinition<RequestType, ResponseType>,
    call: GrpcCall<RequestType, ResponseType>,
    result?: ResponseType,
    chronometer?: IChronometer,
  ): void {
    if (this.logger === undefined) {
      return
    }

    const request = !methodDefinition.requestStream
      ? (call as Exclude<
          GrpcCall<RequestType, ResponseType>,
          grpc.ServerReadableStream<RequestType, ResponseType>
        >).request
      : 'STREAM'
    const response = !methodDefinition.responseStream ? result : 'STREAM'
    const isError = result instanceof Error
    const logData = {
      request,
      [isError ? 'error' : 'response']: response,
      path: methodDefinition.path,
      emitter: 'service',
      latency: chronometer?.getEllapsedTime(),
    }

    this.logger.info(`GRPC service ${logData.path}`, logData)
  }
}

// TODO: Study the calls chain from that point, this is copied almost literally
//       from the old @join-com/grpc-ts library, without putting much effort
//       into make it cleaner or better in any way.
function handleError<ResponseType>(
  e: Error,
  callback: grpc.sendUnaryData<ResponseType>,
) {
  const metadata = new grpc.Metadata()
  metadata.set('error-bin', Buffer.from(JSON.stringify(e, errorReplacer)))
  callback({
    code: grpc.status.UNKNOWN,
    metadata,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errorReplacer(key: string, value: unknown): any {
  if (key === 'stack') {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type FakeRecord = Record<string, any>

  if (value instanceof Error) {
    const error = Object.getOwnPropertyNames(value).reduce(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      (acc, _key) => ({
        ...acc,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [_key]: (value as FakeRecord)[_key],
      }),
      {},
    )
    return error
  }

  return value
}
