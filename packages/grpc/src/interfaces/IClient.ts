import * as grpc from '@grpc/grpc-js'
import { ObjectWritable } from '@grpc/grpc-js/build/src/object-stream'
import { ServerSurfaceCall } from '@grpc/grpc-js/build/src/server-call'

export type MethodName<ServiceDefinitionType> = string &
  keyof grpc.ServiceDefinition<ServiceDefinitionType>

export type IBidiStreamRequest<RequestType, ResponseType> = {
  call: grpc.ClientDuplexStream<RequestType, ResponseType>
}

export type IClientStreamRequest<RequestType, ResponseType> = {
  call: grpc.ClientWritableStream<RequestType>
  res: Promise<ResponseType>
}

export type IServerStreamRequest<ResponseType> = {
  call: grpc.ClientReadableStream<ResponseType>
}

export type IUnaryRequest<ResponseType> = {
  call: grpc.ClientUnaryCall
  res: Promise<ResponseType>
}

export interface IClient<
  ServiceImplementationType = grpc.UntypedServiceImplementation,
  ServiceNameType extends string = string
> {
  readonly serviceName: ServiceNameType

  makeUnaryRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    argument: RequestType,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): IUnaryRequest<ResponseType>

  makeClientStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): IClientStreamRequest<RequestType, ResponseType>

  makeServerStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    argument: RequestType,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): IServerStreamRequest<ResponseType>

  makeBidiStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceImplementationType>,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): IBidiStreamRequest<RequestType, ResponseType>

  close(): void
}

export type UnaryRequestHandler<RequestType, ResponseType> = (
  argument: RequestType,
  metadata?: Record<string, string>,
  options?: grpc.CallOptions,
) => IUnaryRequest<ResponseType>

export type ClientStreamRequestHandler<RequestType, ResponseType> = (
  metadata?: Record<string, string>,
  options?: grpc.CallOptions,
) => IClientStreamRequest<RequestType, ResponseType>

export type ServerStreamRequestHandler<RequestType, ResponseType> = (
  argument: RequestType,
  metadata?: Record<string, string>,
  options?: grpc.CallOptions,
) => grpc.ClientReadableStream<ResponseType>

export type BidiStreamRequestHandler<RequestType, ResponseType> = (
  metadata?: Record<string, string>,
  options?: grpc.CallOptions,
) => grpc.ClientDuplexStream<RequestType, ResponseType>

export type ClientWrappedHandler<RequestType, ResponseType> =
  | UnaryRequestHandler<RequestType, ResponseType>
  | ClientStreamRequestHandler<RequestType, ResponseType>
  | ServerStreamRequestHandler<RequestType, ResponseType>
  | BidiStreamRequestHandler<RequestType, ResponseType>

type ExtractRequestType<ImplMethod> = ImplMethod extends (
  call: infer CallType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => void
  ? CallType extends { request: infer RequestType }
    ? RequestType
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
  : never

type ExtractResponseType<
  ServiceImplementationType,
  MethodName extends keyof ServiceImplementationType
> = ServiceImplementationType[MethodName] extends (
  call: infer CallType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => void
  ? CallType extends ServerSurfaceCall & ObjectWritable<infer ResponseType>
    ? Exclude<ResponseType, grpc.Metadata | undefined>
    : ServiceImplementationType[MethodName] extends (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        call: CallType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: grpc.sendUnaryData<infer ResponseType>,
      ) => void
    ? ResponseType
    : unknown
  : never

type UncapitalizedMethodNames<
  ServiceImplementationType
> = keyof ServiceImplementationType extends string
  ? Uncapitalize<keyof ServiceImplementationType>
  : keyof ServiceImplementationType

type CondCapitalize<S> = S extends string ? Capitalize<S> : S

export type IExtendedClient<
  ServiceImplementationType = grpc.UntypedServiceImplementation,
  ServiceNameType extends string = string
> = IClient<ServiceImplementationType, ServiceNameType> &
  {
    [methodName in UncapitalizedMethodNames<ServiceImplementationType>]: CondCapitalize<methodName> extends keyof ServiceImplementationType
      ? ClientWrappedHandler<
          ExtractRequestType<
            ServiceImplementationType[CondCapitalize<methodName>]
          >,
          ExtractResponseType<
            ServiceImplementationType,
            CondCapitalize<methodName>
          >
        >
      : never
  }
