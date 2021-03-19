import * as grpc from '@grpc/grpc-js'

export interface IClientConfig<ServiceDefinitionType> {
  serviceName: string
  serviceDefinition: grpc.ServiceDefinition<ServiceDefinitionType>
  address: string
  credentials: grpc.ChannelCredentials
  options?: Partial<grpc.ChannelOptions>
}
