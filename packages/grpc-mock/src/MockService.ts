import { JoinServiceImplementation, Service, grpc } from '@join-com/grpc'
import { errorHandler } from './errorHandler'
import { uncapitalize } from './utils'

export class MockService<
  ServiceImplementationType extends grpc.UntypedServiceImplementation,
> extends Service<ServiceImplementationType> {
  constructor(
    definition: grpc.ServiceDefinition<ServiceImplementationType>,
    implementation: Partial<JoinServiceImplementation<ServiceImplementationType>> = {},
  ) {
    const stubImplementations: JoinServiceImplementation<ServiceImplementationType> = Object.keys(definition).reduce(
      (acc, key) => {
        return Object.assign(acc, {
          [key]: async () => await Promise.resolve({}),
          [uncapitalize(key)]: async () => await Promise.resolve({}),
        })
      },
      {} as JoinServiceImplementation<ServiceImplementationType>,
    )

    super(definition, Object.assign(stubImplementations, implementation), undefined, errorHandler)
  }
}
