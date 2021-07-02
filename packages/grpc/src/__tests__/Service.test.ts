import {
  IClientConfig,
  IServer,
  IServiceMapping,
  JoinServiceImplementation,
  Server,
  Service,
  grpc,
} from '..'
import { Foo } from './generated/foo/Foo'

type ILoggerMock = {
  info: jest.Mock<void, [string, unknown | undefined]>
  warn: jest.Mock<void, [string, unknown | undefined]>
  error: jest.Mock<void, [string, unknown | undefined]>
}

describe('Service', () => {
  let client: Foo.ITestSvcClient
  let server: IServer
  let serverLoggerSpy: ILoggerMock

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
      ;[server, client, serverLoggerSpy] = await startService({
        foo: fooMock,
        fooClientStream: jest.fn(),
        fooServerStream: jest.fn(),
        fooBidiStream: jest.fn(),
      })
    })

    afterEach(() => {
      if (fooMock !== undefined) {
        fooMock.mockClear()
      }
      if (serverLoggerSpy?.info !== undefined) {
        serverLoggerSpy.info.mockClear()
        serverLoggerSpy.warn.mockClear()
        serverLoggerSpy.error.mockClear()
      }
    })

    it('receives data from client in its correct form', async () => {
      fooMock.mockResolvedValue({ result: 'ok' })

      const response = await client.foo({
        id: 42,
        name: ['Recruito', 'Join'],
      }).res

      expect(
        (fooMock.mock.calls[0] as { request: unknown }[])[0]?.request,
      ).toMatchObject({
        id: 42,
        name: ['Recruito', 'Join'],
      })
      expect(response).toEqual({ result: 'ok' })
    })

    it('is able to respond requests after internal error in previous handled request', async () => {
      fooMock
        .mockImplementationOnce(() =>
          Promise.reject(new Error('Internal Error!')),
        )
        .mockImplementationOnce(() => Promise.resolve({ result: 'ok' }))

      // First call should error
      const firstCall = client.foo({
        id: 42,
        name: ['Recruito', 'Join'],
      }).res
      await expect(firstCall).rejects.toBeInstanceOf(Error)
      await expect(firstCall).rejects.toHaveProperty(
        'grpcCode',
        grpc.status.UNKNOWN,
      )

      // Second call should work fine
      const response = await client.foo({
        id: 42,
        name: ['Recruito', 'Join'],
      }).res
      expect(response).toEqual({ result: 'ok' })
    })

    it('logs received requests when logger is available', async () => {
      fooMock.mockResolvedValue({ result: 'ok' })

      await client.foo({
        id: 42,
        name: ['Recruito', 'Join'],
      }).res

      expect(serverLoggerSpy.info).toHaveBeenCalledWith(
        'GRPC Service /foo.TestSvc/Foo',
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          latency: expect.any(Number),
          request: { id: 42, name: ['Recruito', 'Join'] },
          response: { result: 'ok' },
        },
      )
    })

    it('serializes "not found" errors properly', async () => {
      class NotFoundError extends Error {
        public readonly code: string
        constructor(msg: string) {
          super(msg)
          this.name = 'NotFoundError'
          this.code = 'notFound'
        }
      }
      const notFoundError = new NotFoundError('Unable to find you')

      fooMock.mockImplementationOnce(() => Promise.reject(notFoundError))

      const result = client.foo({
        id: 42,
        name: ['Recruito', 'Join'],
      }).res

      await expect(result).rejects.toHaveProperty('code', 'notFound')
      await expect(result).rejects.toHaveProperty(
        'grpcCode',
        grpc.status.NOT_FOUND,
      )
    })
  })
})

async function startService(
  serviceImplementation: JoinServiceImplementation<Foo.ITestSvcServiceImplementation>,
): Promise<[IServer, Foo.ITestSvcClient, ILoggerMock]> {
  const serverLoggerSpy = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }

  const service: IServiceMapping<Foo.ITestSvcServiceImplementation> =
    new Service<Foo.ITestSvcServiceImplementation>(
      Foo.testSvcServiceDefinition,
      serviceImplementation,
      serverLoggerSpy,
    )

  const serverCredentials = grpc.ServerCredentials.createInsecure()
  const server = new Server(serverCredentials, serverLoggerSpy)

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

  return await Promise.resolve([server, client, serverLoggerSpy])
}
