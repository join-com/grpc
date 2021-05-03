import { JoinServiceImplementation, Service, grpc } from '@join-com/grpc'

export class MockService<
  ServiceImplementationType extends grpc.UntypedServiceImplementation
> extends Service<ServiceImplementationType> {
  constructor(
    rawDefinitions: grpc.ServiceDefinition<ServiceImplementationType>,
    rawImplementations: Partial<ServiceImplementationType> = {},
  ) {
    const stubImplementations: JoinServiceImplementation<ServiceImplementationType> = Object.keys(
      rawDefinitions,
    ).reduce(
      (acc, key) =>
        Object.assign(acc, { [key]: async () => Promise.resolve({}) }),
      {} as JoinServiceImplementation<ServiceImplementationType>,
    )

    super(
      rawDefinitions,
      Object.assign(stubImplementations, rawImplementations),
    )
  }
}
