import { ConflictError, InvalidInputError, NotFoundError, ValidationError } from '@join-private/base-errors'
import { JoinServiceImplementation, IServer, Server, Service, grpc } from '..'
import { Foo } from './generated/foo/Foo'
import { mockLogger } from './support/mockLogger'

const serverLoggerMock = mockLogger()
const clientLoggerMock = mockLogger()

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
    const fooMock = jest.fn()
    const fooRequest: Foo.IFooRequest = {
      id: 42,
      name: ['Recruito', 'Join'],
    }

    beforeAll(async () => {
      ;[server, client] = await startService({
        foo: fooMock,
        fooClientStream: jest.fn(),
        fooServerStream: jest.fn(),
        fooBidiStream: jest.fn(),
      })
    })

    it('receives data from client in its correct form', async () => {
      fooMock.mockResolvedValue({ result: 'ok' })

      const response = await client.foo(fooRequest).res

      expect(response).toEqual({ result: 'ok' })
      expect(fooMock).toHaveBeenRequestedWith({
        id: 42,
        name: ['Recruito', 'Join'],
      })
    })

    it('is able to respond requests after internal error in previous handled request', async () => {
      fooMock.mockRejectedValueOnce(new Error('Internal Error!'))
      fooMock.mockResolvedValueOnce({ result: 'ok' })

      // First call should error
      const firstCall = client.foo(fooRequest).res

      await expect(firstCall).rejects.toBeInstanceOf(Error)
      await expect(firstCall).rejects.toHaveProperty('grpcCode', grpc.status.UNKNOWN)

      // Second call should work fine
      const response = await client.foo(fooRequest).res
      expect(response).toEqual({ result: 'ok' })
    })

    it('logs received requests when logger is available', async () => {
      fooMock.mockResolvedValue({ result: 'ok' })

      await client.foo(fooRequest).res

      expect(serverLoggerMock.info).toHaveBeenCalledWith('GRPC Service /foo.TestSvc/Foo', {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        latency: expect.any(Number),
        request: { id: 42, name: ['Recruito', 'Join'] },
        response: { result: 'ok' },
      })
    })

    it('handles notFound errors', async () => {
      fooMock.mockRejectedValue(new NotFoundError('Unable to find you'))

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'notFound',
        grpcCode: grpc.status.NOT_FOUND,
      })

      expect(serverLoggerMock.info).toHaveBeenCalledWith('GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.warn).toHaveBeenCalledWith('GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('handles validation errors', async () => {
      const error = new ValidationError([
        {
          fieldName: 'email',
          constraint: 'isNotEmpty',
          message: 'email should not be empty',
        },
      ])
      fooMock.mockRejectedValue(error)

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'validation',
        grpcCode: grpc.status.INVALID_ARGUMENT,
        fields: error.fields,
      })

      expect(serverLoggerMock.info).toHaveBeenCalledWith('GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.warn).toHaveBeenCalledWith('GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('handles invalid input errors', async () => {
      fooMock.mockRejectedValue(new InvalidInputError('malformed data'))

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'invalidInput',
        grpcCode: grpc.status.INVALID_ARGUMENT,
      })

      expect(serverLoggerMock.info).toHaveBeenCalledWith('GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.warn).toHaveBeenCalledWith('GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('handles conflict errors', async () => {
      fooMock.mockRejectedValue(new ConflictError('user already deleted'))

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'conflict',
        grpcCode: grpc.status.FAILED_PRECONDITION,
      })

      expect(serverLoggerMock.info).toHaveBeenCalledWith('GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.warn).toHaveBeenCalledWith('GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('throws unless response value provided', async () => {
      await expect(client.foo(fooRequest).res).rejects.toThrow(
        'Missing or no result for method handler at path /foo.TestSvc/Foo',
      )
    })
  })
})

async function startService(
  serviceImplementation: JoinServiceImplementation<Foo.ITestSvcServiceImplementation>,
): Promise<[IServer, Foo.ITestSvcClient]> {
  const serverCredentials = grpc.ServerCredentials.createInsecure()
  const server = new Server(serverCredentials, serverLoggerMock)

  const service = new Service<Foo.ITestSvcServiceImplementation>(
    Foo.testSvcServiceDefinition,
    serviceImplementation,
    serverLoggerMock,
  )
  server.addService(service)

  await server.start('0.0.0.0:0')

  const client = new Foo.TestSvcClient({
    address: `0.0.0.0:${server.port!}`,
    logger: clientLoggerMock,
  })

  return await Promise.resolve([server, client])
}
