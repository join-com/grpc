import * as grpc from '@grpc/grpc-js'
import { IErrorLogger, IInfoLogger } from './ILogger'
import { IClientTrace } from './ITrace'

export interface IClientConfig<
  ServiceImplementationType = grpc.UntypedServiceImplementation
> {
  serviceDefinition: grpc.ServiceDefinition<ServiceImplementationType>
  address: string
  credentials: grpc.ChannelCredentials
  options?: Partial<grpc.ChannelOptions>
  trace?: IClientTrace
  logger?: IInfoLogger & IErrorLogger
}
