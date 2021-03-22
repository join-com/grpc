import * as grpc from '@grpc/grpc-js'

export interface IClientConfig<
  ServiceDefinitionType = grpc.UntypedServiceImplementation
> {
  serviceName: string
  serviceDefinition: grpc.ServiceDefinition<ServiceDefinitionType>
  address: string
  credentials: grpc.ChannelCredentials
  options?: Partial<grpc.ChannelOptions>
}
