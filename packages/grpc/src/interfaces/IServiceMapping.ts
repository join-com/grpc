import * as grpc from '@grpc/grpc-js'

export interface IServiceMapping<
  ServiceImplementationType = grpc.UntypedServiceImplementation
> {
  readonly definition: grpc.ServiceDefinition<ServiceImplementationType>
  readonly implementation: ServiceImplementationType
}
