import * as grpc from '@grpc/grpc-js'
import { Chronometer, IChronometer } from './Chronometer'
import { isApplicationError } from './errors/isApplicationError'
import { INoDebugLogger } from './interfaces/ILogger'
import { IServiceMapping } from './interfaces/IServiceMapping'
import { IServiceTrace } from './interfaces/ITrace'
import { CondCapitalize, UncapitalizedMethodNames } from './types/CapitalizationAdapters'

// We replicate the grpc internal type because for some reason they don't export
// it, although it's trivial to construct, so it's not them trying to hide
// implementation details.
type HandleStreamCall<RequestType, ResponseType> =
  | grpc.handleClientStreamingCall<RequestType, ResponseType>
  | grpc.handleServerStreamingCall<RequestType, ResponseType>
  | grpc.handleBidiStreamingCall<RequestType, ResponseType>

type GrpcCall<RequestType, ResponseType> =
  | grpc.ServerUnaryCall<RequestType, ResponseType>
  | grpc.ServerReadableStream<RequestType, ResponseType>
  | grpc.ServerWritableStream<RequestType, ResponseType>
  | grpc.ServerDuplexStream<RequestType, ResponseType>

export type JoinGrpcHandler<
  RequestType = unknown,
  ResponseType = unknown,
  Callback extends undefined | grpc.sendUnaryData<ResponseType> = undefined,
  RequestWrapper extends GrpcCall<RequestType, ResponseType> = GrpcCall<RequestType, ResponseType>,
> = Callback extends undefined
  ? RequestWrapper extends
      | grpc.ServerWritableStream<RequestType, ResponseType>
      | grpc.ServerDuplexStream<RequestType, ResponseType>
    ? (requestWrapper: RequestWrapper) => void
    : (requestWrapper: RequestWrapper) => Promise<ResponseType>
  : (requestWrapper: RequestWrapper, callback: Callback) => void

export type JoinServiceImplementation<ServiceImplementationType = grpc.UntypedServiceImplementation> = {
  [methodName in UncapitalizedMethodNames<ServiceImplementationType>]: CondCapitalize<methodName> extends keyof InternalJoinServiceImplementation<ServiceImplementationType>
    ? InternalJoinServiceImplementation<ServiceImplementationType>[CondCapitalize<methodName>]
    : never
}

export type InternalJoinServiceImplementation<ServiceImplementationType = grpc.UntypedServiceImplementation> = {
  [Key in keyof ServiceImplementationType]: ServiceImplementationType[Key] extends grpc.handleUnaryCall<
    infer RequestType,
    infer ResponseType
  >
    ? JoinGrpcHandler<RequestType, ResponseType, undefined, grpc.ServerUnaryCall<RequestType, ResponseType>>
    : ServiceImplementationType[Key] extends grpc.handleServerStreamingCall<infer RequestType, infer ResponseType>
    ? JoinGrpcHandler<RequestType, ResponseType, undefined, grpc.ServerWritableStream<RequestType, ResponseType>>
    : ServiceImplementationType[Key] extends grpc.handleClientStreamingCall<infer RequestType, infer ResponseType>
    ? JoinGrpcHandler<RequestType, ResponseType, undefined, grpc.ServerReadableStream<RequestType, ResponseType>>
    : ServiceImplementationType[Key] extends grpc.handleBidiStreamingCall<infer RequestType, infer ResponseType>
    ? JoinGrpcHandler<RequestType, ResponseType, undefined, grpc.ServerDuplexStream<RequestType, ResponseType>>
    : JoinGrpcHandler
}

export class Service<
  // Although it would allow us to remove a lot of ESlint "disable" directives in this file, we can't make
  // `ServiceImplementationType` to extend grpc.UntypedServiceImplementation, because of the "indexed properties" it
  // introduces. The "indexed properties" would make impossible to instantiate
  ServiceImplementationType = grpc.UntypedServiceImplementation,
> implements IServiceMapping<ServiceImplementationType>
{
  public readonly implementation: ServiceImplementationType

  constructor(
    public readonly definition: grpc.ServiceDefinition<ServiceImplementationType>,
    implementation: JoinServiceImplementation<ServiceImplementationType>,
    protected readonly logger?: INoDebugLogger,
    protected readonly trace?: IServiceTrace,
  ) {
    this.implementation = this.adaptImplementation(implementation)
  }

  private adaptImplementation(
    promisifiedImplementation: JoinServiceImplementation<ServiceImplementationType>,
  ): ServiceImplementationType {
    const promisifiedImplementationWithCapitalizedKeys = Object.entries(promisifiedImplementation).reduce(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (acc, [name, handler]) => {
        return {
          ...acc,
          [(name[0]?.toUpperCase() ?? '') + name.slice(1)]: handler,
        }
      },
      {},
    )

    return Object.entries(promisifiedImplementationWithCapitalizedKeys).reduce(
      (acc, [name, handler]) => {
        // Obtaining definition
        const methodDefinition = (
          this.definition as {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [key: string]: grpc.MethodDefinition<any, any>
          }
        )[name]

        if (!methodDefinition) {
          throw new Error(`Unable to find method definition '${name}'`)
        }

        // Inspecting definition
        const isClientStream = !methodDefinition.responseStream && methodDefinition.requestStream
        const isUnary = !methodDefinition.responseStream && !methodDefinition.requestStream

        // Inspecting implementation
        const hasCallback = (handler as grpc.UntypedHandleCall).length === 2

        let newHandler: grpc.UntypedHandleCall

        if ((isClientStream || isUnary) && !hasCallback) {
          newHandler = this.adaptPromiseHandler(
            handler as JoinGrpcHandler<
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              any,
              undefined,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              grpc.ServerUnaryCall<any, any>
            >,
            methodDefinition,
          )
        } else if (!methodDefinition.responseStream) {
          newHandler = this.adaptCallbackHandler(
            handler as JoinGrpcHandler<
              unknown,
              unknown,
              grpc.sendUnaryData<unknown> // The assertion on this one is implicit in the if-else condition
            >,
            methodDefinition,
          )
        } else {
          newHandler = this.adaptStreamHandler(
            handler as (
              call: grpc.ServerWritableStream<unknown, unknown>,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...args: any[]
            ) => void, // The assertion on this one is implicit in the if-else condition
            methodDefinition,
          )
        }

        return {
          ...acc,
          [name]: newHandler,
        }
      },
      {} as ServiceImplementationType, // It's safer to do the static cast here than on the whole result
    )
  }

  private adaptPromiseHandler<RequestType, ResponseType>(
    handler: JoinGrpcHandler<
      RequestType,
      ResponseType,
      undefined,
      grpc.ServerUnaryCall<RequestType, ResponseType> | grpc.ServerReadableStream<RequestType, ResponseType>
    >,
    methodDefinition: grpc.MethodDefinition<RequestType, ResponseType>,
  ): grpc.handleUnaryCall<RequestType, ResponseType> {
    return async (call: Parameters<typeof handler>[0], callback: grpc.sendUnaryData<ResponseType>): Promise<void> => {
      const chronometer = new Chronometer()
      try {
        const result = await (handler as (v: Parameters<typeof handler>[0]) => Promise<ResponseType>)(call)

        if (!result) {
          throw new Error(`Missing or no result for method handler at path ${methodDefinition.path}`)
        }

        this.logCall(methodDefinition, call, result, chronometer)
        callback(null, result)
      } catch (e) {
        this.logCall(methodDefinition, call, e, chronometer)
        handleError(e, callback)
      }
    }
  }

  private adaptCallbackHandler<RequestType, ResponseType>(
    handler: JoinGrpcHandler<RequestType, ResponseType, grpc.sendUnaryData<ResponseType>>,
    methodDefinition: grpc.MethodDefinition<RequestType, ResponseType>,
  ): grpc.handleUnaryCall<RequestType, ResponseType> {
    return (call: GrpcCall<RequestType, ResponseType>, callback: grpc.sendUnaryData<ResponseType>): void => {
      const chronometer = new Chronometer()
      const callbackWrapper = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        err: any,
        result?: ResponseType | null,
        trailer?: grpc.Metadata,
        flags?: number,
      ) => {
        this.logCall(methodDefinition, call, result as ResponseType, chronometer)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        callback(err, result, trailer, flags)
      }
      handler(call, callbackWrapper)
    }
  }

  private adaptStreamHandler<RequestType, ResponseType>(
    handler: (
      call: grpc.ServerWritableStream<RequestType, ResponseType>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => void,
    methodDefinition: grpc.MethodDefinition<RequestType, ResponseType>,
  ): HandleStreamCall<RequestType, ResponseType> {
    return (call: grpc.ServerWritableStream<RequestType, ResponseType>, ...args: unknown[]) => {
      this.logCall(methodDefinition, call)
      handler(call, ...args)
    }
  }

  private logCall<RequestType, ResponseType>(
    methodDefinition: grpc.MethodDefinition<RequestType, ResponseType>,
    call: GrpcCall<RequestType, ResponseType>,
    result?: unknown,
    chronometer?: IChronometer,
  ): void {
    if (this.logger === undefined) {
      return
    }

    const latency = chronometer?.getElapsedTime()
    const request = !methodDefinition.requestStream
      ? (call as Exclude<GrpcCall<RequestType, ResponseType>, grpc.ServerReadableStream<RequestType, ResponseType>>)
          .request
      : 'STREAM'

    const response = !methodDefinition.responseStream ? result : 'STREAM'

    if (!(result instanceof Error)) {
      this.logger.info(`GRPC Service ${methodDefinition.path}`, { request, response, latency })
    } else if (isApplicationError(result)) {
      this.logger.info(`GRPC Service ${methodDefinition.path}`, { request, error: response, latency })
    } else {
      this.logger.error(`GRPC Service ${methodDefinition.path}`, { request, error: response, latency })
    }
  }
}

function handleError<ResponseType>(error: unknown, callback: grpc.sendUnaryData<ResponseType>) {
  if (!(error instanceof Error)) {
    callback({ code: grpc.status.UNKNOWN, details: 'Unknown error object received' })
    return
  }

  const code = mapGrpcStatusCode(error)
  const metadata = new grpc.Metadata()
  const errorMetadata = Buffer.from(JSON.stringify(error, errorReplacer))
  metadata.set('error-bin', errorMetadata)

  callback({ code, details: error.message, metadata })
}

function errorReplacer(key: string, value: unknown): unknown {
  if (key === 'stack') {
    return
  }

  if (!(value instanceof Error)) {
    return value
  }

  const errorOutput: Record<string, unknown> = {}
  const errorProperties = Object.getOwnPropertyNames(value)

  errorProperties.forEach(key => {
    errorOutput[key] = (value as unknown as Record<string, unknown>)[key]
  })

  return errorOutput
}

function mapGrpcStatusCode(error: Error): grpc.status {
  if (!isApplicationError(error)) {
    return grpc.status.UNKNOWN
  }

  switch (error.code) {
    case 'validation':
      return grpc.status.INVALID_ARGUMENT
    case 'invalidInput':
      return grpc.status.INVALID_ARGUMENT
    case 'notFound':
      return grpc.status.NOT_FOUND
    case 'conflict':
      return grpc.status.FAILED_PRECONDITION
    default:
      return grpc.status.UNKNOWN
  }
}
