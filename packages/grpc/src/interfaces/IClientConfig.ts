import * as grpc from '@grpc/grpc-js'
import { IClientTrace } from './ITrace'
import { INoDebugLogger } from './ILogger'

export interface IClientConfig<
  ServiceImplementationType = grpc.UntypedServiceImplementation
> {
  serviceDefinition: grpc.ServiceDefinition<ServiceImplementationType>
  address: string
  credentials: grpc.ChannelCredentials
  options?: Partial<grpc.ChannelOptions>
  trace?: IClientTrace
  logger?: INoDebugLogger
}

export type ISimplifiedClientConfig<
  ServiceImplementationType = grpc.UntypedServiceImplementation
> = Omit<
  IClientConfig<ServiceImplementationType>,
  'serviceDefinition' | 'credentials'
> & { credentials?: grpc.ChannelCredentials }
