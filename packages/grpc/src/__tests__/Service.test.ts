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
  let client: Foo.ITestSvcClient
  let server: IServer

  afterAll(async () => {
    if (client !== undefined) {
      client.close()
    }
    if (server !== undefined) {
      await server.tryShutdown()
    }
  })

  describe('unary call', () => {
    const fooMock = jest.fn(() => Promise.resolve({ result: 'ok' }))

    beforeAll(async () => {
      ;[server, client] = await startService({
        Foo: fooMock,
        FooClientStream: jest.fn(),
        FooServerStream: jest.fn(),
        FooBidiStream: jest.fn(),
      })
    })

    afterEach(() => {
      if (fooMock !== undefined) {
        fooMock.mockClear()
      }
    })

    it('receives data from client in its correct form', async () => {
      fooMock.mockResolvedValue({ result: 'ok' })

      const response = await client.Foo({
        id: 42,
        name: ['Recruito', 'Join'],
      }).res

      expect((fooMock.mock.calls[0] as { request: unknown }[])[0]?.request).toMatchObject({
        id: 42,
        name: ['Recruito', 'Join'],
      })
      expect(response).toEqual({ result: 'ok' })
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
