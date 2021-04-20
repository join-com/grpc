// GENERATED CODE -- DO NOT EDIT!

import * as protobufjs from 'protobufjs/light'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GoogleProtobuf {
  interface ConvertibleTo<T> {
    asInterface(): T
  }

  export interface IEmpty {}

  @protobufjs.Type.d('Empty')
  export class Empty
    extends protobufjs.Message<Empty>
    implements ConvertibleTo<IEmpty>, IEmpty {
    public asInterface(): IEmpty {
      return this
    }

    public static fromInterface(this: void, value: IEmpty): Empty {
      return Empty.fromObject(value)
    }

    public static decodePatched(
      this: void,
      reader: protobufjs.Reader | Uint8Array,
    ): IEmpty {
      return Empty.decode(reader)
    }

    public static encodePatched(
      this: void,
      message: IEmpty,
      writer?: protobufjs.Writer,
    ): protobufjs.Writer {
      return Empty.encode(message, writer)
    }
  }
}
