import * as grpc from '@grpc/grpc-js'

export type ServerUnaryCall<T> = grpc.ServerUnaryCall<T, unknown>
export type ServerWritableStream<T> = grpc.ServerWritableStream<T, unknown>
