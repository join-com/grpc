import { mocked } from 'jest-mock'
import { JoinServiceImplementation, IServer, Server, Service, grpc } from '..'
import { IGeneralLogger } from '../interfaces/ILogger'
import { Foo } from './generated/foo/Foo'

const serverLoggerMock = mocked<IGeneralLogger>({
  log: jest.fn(),
})

const clientLoggerMock = mocked<IGeneralLogger>({
  log: jest.fn(),
})

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

      expect(serverLoggerMock.log).toHaveBeenCalledWith('INFO', 'GRPC Service /foo.TestSvc/Foo', {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        latency: expect.any(Number),
        request: { id: 42, name: ['Recruito', 'Join'] },
        response: { result: 'ok' },
      })
    })

    it('handles notFound errors', async () => {
      class NotFoundError extends Error {
        readonly type = 'ApplicationError'
        readonly code = 'notFound'
      }

      fooMock.mockRejectedValue(new NotFoundError())

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'notFound',
        grpcCode: grpc.status.NOT_FOUND,
      })

      expect(serverLoggerMock.log).toHaveBeenCalledWith('INFO', 'GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.log).toHaveBeenCalledWith('WARN', 'GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('handles validation errors', async () => {
      class ValidationError extends Error {
        readonly type = 'ApplicationError'
        readonly code = 'validation'
        readonly fields = [
          {
            fieldName: 'email',
            constraint: 'isNotEmpty',
            message: 'email should not be empty',
          },
        ]
      }

      const error = new ValidationError()
      fooMock.mockRejectedValue(error)

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'validation',
        grpcCode: grpc.status.INVALID_ARGUMENT,
        fields: error.fields,
      })

      expect(serverLoggerMock.log).toHaveBeenCalledWith('INFO', 'GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.log).toHaveBeenCalledWith('WARN', 'GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('handles invalid input errors', async () => {
      class InvalidInputError extends Error {
        readonly type = 'ApplicationError'
        readonly code = 'invalidInput'
      }

      fooMock.mockRejectedValue(new InvalidInputError())

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'invalidInput',
        grpcCode: grpc.status.INVALID_ARGUMENT,
      })

      expect(serverLoggerMock.log).toHaveBeenCalledWith('INFO', 'GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.log).toHaveBeenCalledWith('WARN', 'GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('handles conflict errors', async () => {
      class ConflictError extends Error {
        readonly type = 'ApplicationError'
        readonly code = 'conflict'
      }
      fooMock.mockRejectedValue(new ConflictError())

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'conflict',
        grpcCode: grpc.status.FAILED_PRECONDITION,
      })

      expect(serverLoggerMock.log).toHaveBeenCalledWith('INFO', 'GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.log).toHaveBeenCalledWith('WARN', 'GRPC Client /foo.TestSvc/Foo', expect.any(Object))
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
