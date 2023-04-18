import * as grpc from '@grpc/grpc-js'
import { Consistency } from '../metadata/Consistency'
import { INoDebugLogger } from './ILogger'

// IgnoreMe shouldn't be used - it's for backward compatibility with the old version that has obtained a type parameter
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ISimplifiedClientConfig<_IgnoreMe = never> {
  address: string
  credentials?: grpc.ChannelCredentials
  options?: Partial<grpc.ChannelOptions>
  logger?: INoDebugLogger
  consistency?: Consistency
}

export interface IClientConfig<ServiceImplementationType = grpc.UntypedServiceImplementation>
  extends ISimplifiedClientConfig {
  serviceDefinition: grpc.ServiceDefinition<ServiceImplementationType>
  credentials: grpc.ChannelCredentials
}
