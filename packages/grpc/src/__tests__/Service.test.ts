import {
  IClientConfig,
  IInfoLogger,
  IServer,
  IServiceMapping,
  JoinServiceImplementation,
  Server,
  Service,
  grpc,
} from '..'
import { Foo } from './generated/foo/Foo'

describe('Service', () => {
  let client: Foo.ITestSvcClient | undefined
  let server: IServer | undefined

  afterAll(async () => {
    if (client !== undefined) {
      client.close()
    }
    if (server !== undefined) {
      await server.tryShutdown()
    }
  })

  describe('unary call', () => {
    beforeAll(async () => {
      ;[server, client] = await startService({
        Foo: jest.fn(),
        FooClientStream: jest.fn(),
        FooServerStream: jest.fn(),
        FooBidiStream: jest.fn(),
      })
    })
  })

  describe('client stream call', () => {
    beforeAll(async () => {
      ;[server, client] = await startService({
        Foo: jest.fn(),
        FooClientStream: jest.fn(),
        FooServerStream: jest.fn(),
        FooBidiStream: jest.fn(),
      })
    })
  })

  describe('server stream call', () => {
    beforeAll(async () => {
      ;[server, client] = await startService({
        Foo: jest.fn(),
        FooClientStream: jest.fn(),
        FooServerStream: jest.fn(),
        FooBidiStream: jest.fn(),
      })
    })
  })

  describe('bidi stream call', () => {
    beforeAll(async () => {
      ;[server, client] = await startService({
        Foo: jest.fn(),
        FooClientStream: jest.fn(),
        FooServerStream: jest.fn(),
        FooBidiStream: jest.fn(),
      })
    })
  })
})

async function startService(
  serviceImplementation: JoinServiceImplementation<Foo.ITestSvcServiceImplementation>,
): Promise<[IServer, Foo.ITestSvcClient, IInfoLogger]> {
  const service: IServiceMapping<Foo.ITestSvcServiceImplementation> = new Service<Foo.ITestSvcServiceImplementation>(
    Foo.testSvcServiceDefinition,
    serviceImplementation,
  )

  const loggerSpy = { info: jest.fn() }
  const serverCredentials = grpc.ServerCredentials.createInsecure()
  const server = new Server(serverCredentials, loggerSpy)

  server.addService(service)

  await server.start('0.0.0.0:0')

  if (!server.port) {
    throw new Error('Unable to bind server port')
  }

  const clientCredentials = grpc.credentials.createInsecure()
  const clientConfig: IClientConfig<
    grpc.ServiceDefinition<Foo.ITestSvcServiceImplementation>
  > = {
    serviceDefinition: Foo.testSvcServiceDefinition,
    address: `0.0.0.0:${server.port}`,
    credentials: clientCredentials,
  }
  const client = new Foo.TestSvcClient(clientConfig)

  return await Promise.resolve([server, client, loggerSpy])
}
