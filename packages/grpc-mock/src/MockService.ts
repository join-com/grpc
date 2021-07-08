import { JoinServiceImplementation, Service, grpc } from '@join-com/grpc'
import { uncapitalize } from './utils'

export class MockService<
  ServiceImplementationType = grpc.UntypedServiceImplementation,
> extends Service<ServiceImplementationType> {
  constructor(
    definition: grpc.ServiceDefinition<ServiceImplementationType>,
    implementation: Partial<
      JoinServiceImplementation<ServiceImplementationType>
    > = {},
  ) {
    const stubImplementations: JoinServiceImplementation<ServiceImplementationType> =
      Object.keys(definition).reduce(
        (acc, key) => {
          return Object.assign(acc, {
            [key]: async () => Promise.resolve({}),
            [uncapitalize(key)]: async () => Promise.resolve({}),
          })},
        {} as JoinServiceImplementation<ServiceImplementationType>,
      )

    super(definition, Object.assign(stubImplementations, implementation))
  }
}
