// Type exports
export type {
  IClient,
  IClientStreamRequest,
  IExtendedClient,
  IUnaryRequest,
} from './interfaces/IClient'
export type { IClientConfig } from './interfaces/IClientConfig'
export type { IServer } from './interfaces/IServer'
export type { IClientTrace, IServiceTrace } from './interfaces/ITrace'

// Class exports
export * from './Client'
export * from './Server'
export * from './Service'

export * as grpc from '@grpc/grpc-js'
