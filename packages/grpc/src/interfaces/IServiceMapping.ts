import * as grpc from '@grpc/grpc-js'

export interface IServiceMapping<
  ServiceImplementationType = grpc.UntypedServiceImplementation,
  ServiceDefinitionType extends grpc.ServiceDefinition<ServiceImplementationType> = grpc.ServiceDefinition<ServiceImplementationType>
> {
  readonly definition: ServiceDefinitionType
  readonly implementation: ServiceImplementationType
}
