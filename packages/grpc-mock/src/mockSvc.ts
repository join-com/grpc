import { MockService } from './MockService'
import { Server } from '@join-com/grpc'
import { uncapitalize } from './utils'

type Mock<T> = {
  [P in keyof T]: T[P] extends (...args: infer Args) => infer R
    ? T[P] & jest.Mock<R, Args>
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T[P] & jest.Mock<any, any>
}

type UncapitalizedKeys<RecordType> = keyof RecordType extends string
  ? Uncapitalize<keyof RecordType>
  : keyof RecordType

type CondCapitalize<S> = S extends string ? Capitalize<S> : S

type UncapitalizedMock<T> = Mock<T> &
  {
    [key in UncapitalizedKeys<
      Mock<T>
    >]: CondCapitalize<key> extends keyof Mock<T>
      ? Mock<T>[CondCapitalize<key>]
      : key extends keyof Mock<T>
      ? Mock<T>[key]
      : never
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TObject = Record<string, any>

export type Config<T> = {
  readonly [K in keyof T]?: true
}

export type ServiceMock<T> = {
  readonly [K in keyof T]: UncapitalizedMock<T[K]>
}

export type MockGetter<T> = () => ServiceMock<T>

export const mockSvc = <T extends TObject>(
  config: Config<T>,
  serviceDefinitions: T,
  serviceHost: `${string}:${number}`,
  closeClients: () => void,
): MockGetter<T> => {
  let server: Server
  let serviceMock: ServiceMock<T>

  beforeAll(async () => {
    serviceMock = mockEnabledServices(config, serviceDefinitions)

    server = new Server()
    addMockServices(server, serviceDefinitions, serviceMock)
    await server.start(serviceHost)
  })

  afterAll(async () => {
    await server.tryShutdown()
    closeClients()
  })

  afterEach(() => {
    Object.values(serviceMock).forEach(resetDefinedMocks)
  })

  return () => serviceMock
}

const mockEnabledServices = <T extends TObject>(
  config: Config<T>,
  serviceDefinitions: T,
): ServiceMock<T> =>
  enabledServices(config).reduce(
    (acc: ServiceMock<T>, service: keyof T) => ({
      ...acc,
      ...{ [service]: mockProperties(serviceDefinitions[service]) },
    }),
    {} as ServiceMock<T>,
  )

const enabledServices = <T extends TObject>(config: Config<T>): (keyof T)[] =>
  Object.entries(config)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, v]) => Boolean(v))
    .map(([k]) => k as keyof T)

const addMockServices = <T extends TObject>(
  server: Server,
  serviceDefinitions: T,
  serviceMock: ServiceMock<T>,
) =>
  Object.entries(serviceMock)
    .map(
      ([service, mockedDefinition]) =>
        new MockService(serviceDefinitions[service], mockedDefinition),
    )
    .forEach((svc) => server.addService(svc))

const resetDefinedMocks = <T extends TObject>(o: Mock<T>) =>
  Object.values(o)
    .filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .forEach((m) => (m as jest.Mock<any, any>).mockReset())

const mockProperties = <O>(object: O): Mock<O> =>
  Object.keys(object).reduce((acc: Mock<O>, curr: string) => {
    const mockedFunction = jest.fn()
    return {
      ...acc,
      [curr]: mockedFunction, // for internals compatibility
      [uncapitalize(curr)]: mockedFunction, // for external api compatibility
    }
  }, {} as Mock<O>)
