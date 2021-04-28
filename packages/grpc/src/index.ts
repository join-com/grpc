// Type exports
export type {
  IClient,
  IClientStreamRequest,
  IExtendedClient,
  IUnaryRequest,
} from './interfaces/IClient'
export type { IClientConfig } from './interfaces/IClientConfig'
export type {
  IInfoLogger,
  IErrorLogger,
  INoDebugLogger,
  IWarnLogger,
} from './interfaces/ILogger'
export type { IServer } from './interfaces/IServer'
export type { IServiceMapping } from './interfaces/IServiceMapping'
export type { IClientTrace, IServiceTrace } from './interfaces/ITrace'

// Class exports
export { Client } from './Client'
export { Server } from './Server'
export { JoinServiceImplementation, Service } from './Service'

export * as grpc from '@grpc/grpc-js'
