// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as protobufjs from 'protobufjs/light'

import { GoogleProtobuf } from '../google/protobuf/Empty'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Common {
  interface ConvertibleTo<T> {
    asInterface(): T
  }

  export interface IEmptyMessage {
    field?: GoogleProtobuf.IEmpty
  }

  @protobufjs.Type.d('common_EmptyMessage')
  export class EmptyMessage
    extends protobufjs.Message<EmptyMessage>
    implements ConvertibleTo<IEmptyMessage>, IEmptyMessage {
    @protobufjs.Field.d(1, GoogleProtobuf.Empty)
    public field?: GoogleProtobuf.Empty

    public asInterface(): IEmptyMessage {
      return this
    }

    public static fromInterface(
      this: void,
      value: IEmptyMessage,
    ): EmptyMessage {
      return EmptyMessage.fromObject(value)
    }

    public static decodePatched(
      this: void,
      reader: protobufjs.Reader | Uint8Array,
    ): IEmptyMessage {
      return EmptyMessage.decode(reader)
    }

    public static encodePatched(
      this: void,
      message: IEmptyMessage,
      writer?: protobufjs.Writer,
    ): protobufjs.Writer {
      return EmptyMessage.encode(message, writer)
    }
  }
}
