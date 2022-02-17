// GENERATED CODE -- DO NOT EDIT!
// GENERATOR VERSION: 2.1.0.d41be8f.1643383265
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as joinGRPC from '../../..'
import * as protobufjs from 'protobufjs/light'

import { Common } from '../common/Common'

import { grpc } from '../../..'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Foo {
  interface ConvertibleTo<T> {
    asInterface(): T
  }

  export interface IFooRequest {
    id: number
    name?: string[]
    password?: string
    token?: string
    empty?: Common.IEmptyMessage
  }

  export interface IStreamBarResponse {
    result?: string
  }

  export interface IBarResponse {
    result?: string
  }

  @protobufjs.Type.d('foo_BarResponse')
  export class BarResponse
    extends protobufjs.Message<BarResponse>
    implements ConvertibleTo<IBarResponse>, IBarResponse
  {
    @protobufjs.Field.d(2, 'string', 'optional')
    public result?: string

    public asInterface(): IBarResponse {
      const message = {
        ...this,
      }
      for (const fieldName of Object.keys(message)) {
        if (message[fieldName as keyof IBarResponse] == null) {
          // We remove the key to avoid problems with code making too many assumptions
          delete message[fieldName as keyof IBarResponse]
        }
      }
      return message
    }

    public static fromInterface(this: void, value: IBarResponse): BarResponse {
      return BarResponse.fromObject(value)
    }

    public static decodePatched(this: void, reader: protobufjs.Reader | Uint8Array): IBarResponse {
      return BarResponse.decode(reader).asInterface()
    }

    public static encodePatched(this: void, message: IBarResponse, writer?: protobufjs.Writer): protobufjs.Writer {
      return BarResponse.encode(message, writer)
    }
  }

  @protobufjs.Type.d('foo_FooRequest')
  export class FooRequest extends protobufjs.Message<FooRequest> implements ConvertibleTo<IFooRequest>, IFooRequest {
    @protobufjs.Field.d(1, 'int32')
    public id!: number

    @protobufjs.Field.d(2, 'string', 'repeated')
    public name?: string[]

    @protobufjs.Field.d(3, 'string', 'optional')
    public password?: string

    @protobufjs.Field.d(4, 'string', 'optional')
    public token?: string

    @protobufjs.Field.d(5, Common.EmptyMessage, 'optional')
    public empty?: Common.EmptyMessage

    public asInterface(): IFooRequest {
      const message = {
        ...this,
        empty: this.empty?.asInterface(),
      }
      for (const fieldName of Object.keys(message)) {
        const field = message[fieldName as keyof IFooRequest]
        if (field == null || (Array.isArray(field) && field.length === 0)) {
          // We remove the key to avoid problems with code making too many assumptions
          delete message[fieldName as keyof IFooRequest]
        }
      }
      return message
    }

    public static fromInterface(this: void, value: IFooRequest): FooRequest {
      return FooRequest.fromObject(value)
    }

    public static decodePatched(this: void, reader: protobufjs.Reader | Uint8Array): IFooRequest {
      const message = FooRequest.decode(reader).asInterface()
      for (const fieldName of ['id'] as (keyof IFooRequest)[]) {
        const field = message[fieldName]
        if (field == null || (Array.isArray(field) && field.length === 0)) {
          throw new Error(`Required field ${fieldName} in FooRequest is null or undefined`)
        }
      }
      return message
    }

    public static encodePatched(this: void, message: IFooRequest, writer?: protobufjs.Writer): protobufjs.Writer {
      for (const fieldName of ['id'] as (keyof IFooRequest)[]) {
        const field = message[fieldName]
        if (field == null || (Array.isArray(field) && field.length === 0)) {
          throw new Error(`Required field ${fieldName} in FooRequest is null or undefined`)
        }
      }
      return FooRequest.encode(message, writer)
    }
  }

  @protobufjs.Type.d('foo_StreamBarResponse')
  export class StreamBarResponse
    extends protobufjs.Message<StreamBarResponse>
    implements ConvertibleTo<IStreamBarResponse>, IStreamBarResponse
  {
    @protobufjs.Field.d(1, 'string', 'optional')
    public result?: string

    public asInterface(): IStreamBarResponse {
      const message = {
        ...this,
      }
      for (const fieldName of Object.keys(message)) {
        if (message[fieldName as keyof IStreamBarResponse] == null) {
          // We remove the key to avoid problems with code making too many assumptions
          delete message[fieldName as keyof IStreamBarResponse]
        }
      }
      return message
    }

    public static fromInterface(this: void, value: IStreamBarResponse): StreamBarResponse {
      return StreamBarResponse.fromObject(value)
    }

    public static decodePatched(this: void, reader: protobufjs.Reader | Uint8Array): IStreamBarResponse {
      return StreamBarResponse.decode(reader).asInterface()
    }

    public static encodePatched(
      this: void,
      message: IStreamBarResponse,
      writer?: protobufjs.Writer,
    ): protobufjs.Writer {
      return StreamBarResponse.encode(message, writer)
    }
  }

  export interface ITestSvcServiceImplementation {
    Foo: grpc.handleUnaryCall<IFooRequest, IBarResponse>
    FooBidiStream: grpc.handleBidiStreamingCall<IFooRequest, IStreamBarResponse>
    FooClientStream: grpc.handleClientStreamingCall<IFooRequest, IBarResponse>
    FooServerStream: grpc.handleServerStreamingCall<IFooRequest, IStreamBarResponse>
  }

  export const testSvcServiceDefinition: grpc.ServiceDefinition<ITestSvcServiceImplementation> = {
    Foo: {
      path: '/foo.TestSvc/Foo',
      requestStream: false,
      responseStream: false,
      requestSerialize: (request: IFooRequest) => FooRequest.encodePatched(request).finish() as Buffer,
      requestDeserialize: FooRequest.decodePatched,
      responseSerialize: (response: IBarResponse) => BarResponse.encodePatched(response).finish() as Buffer,
      responseDeserialize: BarResponse.decodePatched,
    },
    FooBidiStream: {
      path: '/foo.TestSvc/FooBidiStream',
      requestStream: true,
      responseStream: true,
      requestSerialize: (request: IFooRequest) => FooRequest.encodePatched(request).finish() as Buffer,
      requestDeserialize: FooRequest.decodePatched,
      responseSerialize: (response: IStreamBarResponse) => StreamBarResponse.encodePatched(response).finish() as Buffer,
      responseDeserialize: StreamBarResponse.decodePatched,
    },
    FooClientStream: {
      path: '/foo.TestSvc/FooClientStream',
      requestStream: true,
      responseStream: false,
      requestSerialize: (request: IFooRequest) => FooRequest.encodePatched(request).finish() as Buffer,
      requestDeserialize: FooRequest.decodePatched,
      responseSerialize: (response: IBarResponse) => BarResponse.encodePatched(response).finish() as Buffer,
      responseDeserialize: BarResponse.decodePatched,
    },
    FooServerStream: {
      path: '/foo.TestSvc/FooServerStream',
      requestStream: false,
      responseStream: true,
      requestSerialize: (request: IFooRequest) => FooRequest.encodePatched(request).finish() as Buffer,
      requestDeserialize: FooRequest.decodePatched,
      responseSerialize: (response: IStreamBarResponse) => StreamBarResponse.encodePatched(response).finish() as Buffer,
      responseDeserialize: StreamBarResponse.decodePatched,
    },
  }

  export abstract class AbstractTestSvcService extends joinGRPC.Service<ITestSvcServiceImplementation> {
    constructor(protected readonly logger?: joinGRPC.INoDebugLogger, errorHandler?: joinGRPC.IServiceErrorHandler) {
      super(
        testSvcServiceDefinition,
        {
          foo: call => this.Foo(call),
          fooBidiStream: call => this.FooBidiStream(call),
          fooClientStream: call => this.FooClientStream(call),
          fooServerStream: call => this.FooServerStream(call),
        },
        logger,
        errorHandler,
      )
    }

    public abstract Foo(call: grpc.ServerUnaryCall<IFooRequest, IBarResponse>): Promise<IBarResponse>
    public abstract FooBidiStream(call: grpc.ServerDuplexStream<IFooRequest, IStreamBarResponse>): Promise<void>
    public abstract FooClientStream(call: grpc.ServerReadableStream<IFooRequest, IBarResponse>): Promise<IBarResponse>
    public abstract FooServerStream(call: grpc.ServerWritableStream<IFooRequest, IStreamBarResponse>): Promise<void>
  }

  export interface ITestSvcClient extends joinGRPC.IExtendedClient<ITestSvcServiceImplementation, 'foo.TestSvc'> {
    foo(
      request: IFooRequest,
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IUnaryRequest<IBarResponse>

    fooBidiStream(
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IBidiStreamRequest<IFooRequest, IStreamBarResponse>

    fooClientStream(
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IClientStreamRequest<IFooRequest, IBarResponse>

    fooServerStream(
      request: IFooRequest,
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IServerStreamRequest<IStreamBarResponse>
  }

  export class TestSvcClient
    extends joinGRPC.Client<ITestSvcServiceImplementation, 'foo.TestSvc'>
    implements ITestSvcClient
  {
    constructor(config: joinGRPC.ISimplifiedClientConfig<ITestSvcServiceImplementation>) {
      super(
        {
          ...config,
          serviceDefinition: testSvcServiceDefinition,
          credentials: config?.credentials ?? grpc.credentials.createInsecure(),
        },
        'foo.TestSvc',
      )
    }

    public foo(
      request: IFooRequest,
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IUnaryRequest<IBarResponse> {
      return this.makeUnaryRequest('Foo', request, metadata, options)
    }

    public fooBidiStream(
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IBidiStreamRequest<IFooRequest, IStreamBarResponse> {
      return this.makeBidiStreamRequest('FooBidiStream', metadata, options)
    }

    public fooClientStream(
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IClientStreamRequest<IFooRequest, IBarResponse> {
      return this.makeClientStreamRequest('FooClientStream', metadata, options)
    }

    public fooServerStream(
      request: IFooRequest,
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IServerStreamRequest<IStreamBarResponse> {
      return this.makeServerStreamRequest('FooServerStream', request, metadata, options)
    }
  }
}
