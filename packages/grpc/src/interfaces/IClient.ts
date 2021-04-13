import * as grpc from '@grpc/grpc-js'

export type MethodName<ServiceDefinitionType> = string &
  keyof grpc.ServiceDefinition<ServiceDefinitionType>

export type UnaryRequest<ResponseType> = {
  call: grpc.ClientUnaryCall
  res: Promise<ResponseType>
}

export type ClientStreamRequest<RequestType, ResponseType> = {
  call: grpc.ClientWritableStream<RequestType>
  res: Promise<ResponseType>
}

export interface IClient<
  ServiceDefinitionType = grpc.UntypedServiceImplementation
> {
  makeUnaryRequest<RequestType, ResponseType>(
    method: MethodName<ServiceDefinitionType>,
    argument: RequestType,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): UnaryRequest<ResponseType>

  makeClientStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceDefinitionType>,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): ClientStreamRequest<RequestType, ResponseType>

  makeServerStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceDefinitionType>,
    argument: RequestType,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): grpc.ClientReadableStream<ResponseType>

  makeBidiStreamRequest<RequestType, ResponseType>(
    method: MethodName<ServiceDefinitionType>,
    metadata?: Record<string, string>,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<RequestType, ResponseType>

  close(): void
}
