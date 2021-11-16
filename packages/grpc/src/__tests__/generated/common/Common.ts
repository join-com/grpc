// GENERATED CODE -- DO NOT EDIT!
// GENERATOR VERSION: 2.1.0.a1b9e0a.1634555024
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as protobufjs from 'protobufjs/light'

import { GoogleProtobuf } from '../google/protobuf/Empty'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Common {
  const registerGrpcClass = <T extends protobufjs.Message<T>>(
    typeName: string,
  ): protobufjs.TypeDecorator<T> => {
    if (protobufjs.util.decorateRoot.get(typeName) != null) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      return (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _: protobufjs.Constructor<T>,
      ): void => {
        // Do nothing
      }
    }
    return protobufjs.Type.d(typeName)
  }
  interface ConvertibleTo<T> {
    asInterface(): T
  }

  export interface IEmptyMessage {
    field?: GoogleProtobuf.IEmpty
  }

  @registerGrpcClass('common_EmptyMessage')
  export class EmptyMessage
    extends protobufjs.Message<EmptyMessage>
    implements ConvertibleTo<IEmptyMessage>, IEmptyMessage
  {
    @protobufjs.Field.d(1, GoogleProtobuf.Empty, 'optional')
    public field?: GoogleProtobuf.Empty

    public asInterface(): IEmptyMessage {
      const message = {
        ...this,
        field: this.field?.asInterface(),
      }
      for (const fieldName of Object.keys(message)) {
        if (message[fieldName as keyof IEmptyMessage] == null) {
          // We remove the key to avoid problems with code making too many assumptions
          delete message[fieldName as keyof IEmptyMessage]
        }
      }
      return message
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
      return EmptyMessage.decode(reader).asInterface()
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
