// GENERATED CODE -- DO NOT EDIT!

// import * as nodeTrace from '@join-com/node-trace'
import * as joinGRPC from '../../..'
import { grpc } from '../../..'
import * as protobufjs from 'protobufjs/light'

import { Common } from '../common/Common'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Foo {
  interface ConvertibleTo<T> {
    asInterface(): T
  }

  export interface IFooRequest {
    id?: number
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

  @protobufjs.Type.d('FooRequest')
  export class FooRequest
    extends protobufjs.Message<FooRequest>
    implements ConvertibleTo<IFooRequest>, IFooRequest {
    @protobufjs.Field.d(1, 'int32')
    public id?: number

    @protobufjs.Field.d(2, 'string', 'repeated')
    public name?: string[]

    @protobufjs.Field.d(3, 'string')
    public password?: string

    @protobufjs.Field.d(4, 'string')
    public token?: string

    @protobufjs.Field.d(5, Common.EmptyMessage)
    public empty?: Common.EmptyMessage

    public asInterface(): IFooRequest {
      return this
    }

    public static fromInterface(this: void, value: IFooRequest): FooRequest {
      return FooRequest.fromObject(value)
    }

    public static decodePatched(
      this: void,
      reader: protobufjs.Reader | Uint8Array,
    ): IFooRequest {
      return FooRequest.decode(reader)
    }

    public static encodePatched(
      this: void,
      message: IFooRequest,
      writer?: protobufjs.Writer,
    ): protobufjs.Writer {
      return FooRequest.encode(message, writer)
    }
  }

  @protobufjs.Type.d('StreamBarResponse')
  export class StreamBarResponse
    extends protobufjs.Message<StreamBarResponse>
    implements ConvertibleTo<IStreamBarResponse>, IStreamBarResponse {
    @protobufjs.Field.d(1, 'string')
    public result?: string

    public asInterface(): IStreamBarResponse {
      return this
    }

    public static fromInterface(
      this: void,
      value: IStreamBarResponse,
    ): StreamBarResponse {
      return StreamBarResponse.fromObject(value)
    }

    public static decodePatched(
      this: void,
      reader: protobufjs.Reader | Uint8Array,
    ): IStreamBarResponse {
      return StreamBarResponse.decode(reader)
    }

    public static encodePatched(
      this: void,
      message: IStreamBarResponse,
      writer?: protobufjs.Writer,
    ): protobufjs.Writer {
      return StreamBarResponse.encode(message, writer)
    }
  }

  @protobufjs.Type.d('BarResponse')
  export class BarResponse
    extends protobufjs.Message<BarResponse>
    implements ConvertibleTo<IBarResponse>, IBarResponse {
    @protobufjs.Field.d(2, 'string')
    public result?: string

    public asInterface(): IBarResponse {
      return this
    }

    public static fromInterface(this: void, value: IBarResponse): BarResponse {
      return BarResponse.fromObject(value)
    }

    public static decodePatched(
      this: void,
      reader: protobufjs.Reader | Uint8Array,
    ): IBarResponse {
      return BarResponse.decode(reader)
    }

    public static encodePatched(
      this: void,
      message: IBarResponse,
      writer?: protobufjs.Writer,
    ): protobufjs.Writer {
      return BarResponse.encode(message, writer)
    }
  }

  export interface ITestSvcServiceImplementation {
    Foo: grpc.handleUnaryCall<IFooRequest, IBarResponse>
    FooServerStream: grpc.handleServerStreamingCall<
      IFooRequest,
      IStreamBarResponse
    >
    FooClientStream: grpc.handleClientStreamingCall<IFooRequest, IBarResponse>
    FooBidiStream: grpc.handleBidiStreamingCall<IFooRequest, IStreamBarResponse>
  }

  export const testSvcServiceDefinition: grpc.ServiceDefinition<ITestSvcServiceImplementation> = {
    Foo: {
      path: '/foo.TestSvc/Foo',
      requestStream: false,
      responseStream: false,
      requestSerialize: (request: IFooRequest) =>
        FooRequest.encodePatched(request).finish() as Buffer,
      requestDeserialize: FooRequest.decodePatched,
      responseSerialize: (response: IBarResponse) =>
        BarResponse.encodePatched(response).finish() as Buffer,
      responseDeserialize: BarResponse.decodePatched,
    },
    FooServerStream: {
      path: '/foo.TestSvc/FooServerStream',
      requestStream: false,
      responseStream: true,
      requestSerialize: (request: IFooRequest) =>
        FooRequest.encodePatched(request).finish() as Buffer,
      requestDeserialize: FooRequest.decodePatched,
      responseSerialize: (response: IStreamBarResponse) =>
        StreamBarResponse.encodePatched(response).finish() as Buffer,
      responseDeserialize: StreamBarResponse.decodePatched,
    },
    FooClientStream: {
      path: '/foo.TestSvc/FooClientStream',
      requestStream: true,
      responseStream: false,
      requestSerialize: (request: IFooRequest) =>
        FooRequest.encodePatched(request).finish() as Buffer,
      requestDeserialize: FooRequest.decodePatched,
      responseSerialize: (response: IBarResponse) =>
        BarResponse.encodePatched(response).finish() as Buffer,
      responseDeserialize: BarResponse.decodePatched,
    },
    FooBidiStream: {
      path: '/foo.TestSvc/FooBidiStream',
      requestStream: true,
      responseStream: true,
      requestSerialize: (request: IFooRequest) =>
        FooRequest.encodePatched(request).finish() as Buffer,
      requestDeserialize: FooRequest.decodePatched,
      responseSerialize: (response: IStreamBarResponse) =>
        StreamBarResponse.encodePatched(response).finish() as Buffer,
      responseDeserialize: StreamBarResponse.decodePatched,
    },
  }

  export interface ITestSvcClient
    extends joinGRPC.IExtendedClient<
      ITestSvcServiceImplementation,
      'foo.TestSvc'
    > {
    Foo(
      request: IFooRequest,
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IUnaryRequest<IBarResponse>
    FooServerStream(
      request: IFooRequest,
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): grpc.ClientReadableStream<IStreamBarResponse>
    FooClientStream(
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IClientStreamRequest<IFooRequest, IBarResponse>
    FooBidiStream(
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): grpc.ClientDuplexStream<IFooRequest, IStreamBarResponse>
  }

  export class TestSvcClient
    extends joinGRPC.Client<ITestSvcServiceImplementation, 'foo.TestSvc'>
    implements ITestSvcClient {
    constructor(
      public readonly config: joinGRPC.IClientConfig<ITestSvcServiceImplementation>,
    ) {
      super(config, 'foo.TestSvc')
    }

    public Foo(
      request: IFooRequest,
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IUnaryRequest<IBarResponse> {
      return this.makeUnaryRequest('Foo', request, metadata, options)
    }

    public FooServerStream(
      request: IFooRequest,
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): grpc.ClientReadableStream<IStreamBarResponse> {
      return this.makeServerStreamRequest(
        'FooServerStream',
        request,
        metadata,
        options,
      )
    }

    public FooClientStream(
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): joinGRPC.IClientStreamRequest<IFooRequest, IBarResponse> {
      return this.makeClientStreamRequest('FooClientStream', metadata, options)
    }

    public FooBidiStream(
      metadata?: Record<string, string>,
      options?: grpc.CallOptions,
    ): grpc.ClientDuplexStream<IFooRequest, IStreamBarResponse> {
      return this.makeBidiStreamRequest('FooBidiStream', metadata, options)
    }
  }
}
