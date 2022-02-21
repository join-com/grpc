import { JoinServiceImplementation, IServer, Server, Service, grpc } from '..'
import { IServiceErrorHandler } from '../interfaces/IServiceErrorHandler'
import { Foo } from './generated/foo/Foo'
import { mockErrorHandler } from './support/mockErrorHandler'
import { mockLogger } from './support/mockLogger'

const serverLoggerMock = mockLogger()
const clientLoggerMock = mockLogger()
const errorHandlerMock = mockErrorHandler()

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

  const fooMock = jest.fn()
  const fooRequest: Foo.IFooRequest = { id: 42, name: ['Recruito', 'Join'] }

  describe('unary call', () => {
    beforeAll(async () => {
      ;[server, client] = await startService(
        {
          foo: fooMock,
          fooClientStream: jest.fn(),
          fooServerStream: jest.fn(),
          fooBidiStream: jest.fn(),
        },
        errorHandlerMock,
      )
    })

    beforeEach(() => {
      errorHandlerMock.mapGrpcStatusCode.mockReturnValue(grpc.status.OK)
      errorHandlerMock.formatError.mockImplementation((x: Error) => x)
    })

    it('receives data from client in its correct form', async () => {
      fooMock.mockResolvedValue({ result: 'ok' })

      const response = await client.foo(fooRequest).res

      expect(response).toEqual({ result: 'ok' })
      expect(fooMock).toHaveBeenRequestedWith({ id: 42, name: ['Recruito', 'Join'] })
    })

    it('is able to respond requests after internal error in previous handled request', async () => {
      errorHandlerMock.mapGrpcStatusCode.mockReturnValue(grpc.status.UNKNOWN)
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
      errorHandlerMock.mapGrpcStatusCode.mockReturnValue(grpc.status.NOT_FOUND)

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'notFound',
        grpcCode: grpc.status.NOT_FOUND,
      })

      expect(serverLoggerMock.info).toHaveBeenCalledWith('GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.warn).toHaveBeenCalledWith('GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('handles validation errors', async () => {
      const errorMessage = 'Error message'
      class ValidationError extends Error {
        readonly name = 'ValidationError'
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

      const error = new ValidationError(errorMessage)
      fooMock.mockRejectedValue(error)

      errorHandlerMock.mapGrpcStatusCode.mockReturnValue(grpc.status.INVALID_ARGUMENT)

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'validation',
        grpcCode: grpc.status.INVALID_ARGUMENT,
        fields: error.fields,
      })

      expect(errorHandlerMock.formatError).toHaveBeenCalledWith(error)
      expect(serverLoggerMock.info).toHaveBeenCalledWith('GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.warn).toHaveBeenCalledWith('GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('handles invalid input errors', async () => {
      class InvalidInputError extends Error {
        readonly type = 'ApplicationError'
        readonly code = 'invalidInput'
      }
      const error = new InvalidInputError()
      errorHandlerMock.mapGrpcStatusCode.mockReturnValue(grpc.status.INVALID_ARGUMENT)
      fooMock.mockRejectedValue(error)

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'invalidInput',
        grpcCode: grpc.status.INVALID_ARGUMENT,
      })

      expect(errorHandlerMock.formatError).toHaveBeenCalledWith(error)
      expect(serverLoggerMock.info).toHaveBeenCalledWith('GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.warn).toHaveBeenCalledWith('GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('handles conflict errors', async () => {
      class ConflictError extends Error {
        readonly type = 'ApplicationError'
        readonly code = 'conflict'
      }
      const error = new ConflictError()
      fooMock.mockRejectedValue(error)
      errorHandlerMock.mapGrpcStatusCode.mockReturnValue(grpc.status.FAILED_PRECONDITION)

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'conflict',
        grpcCode: grpc.status.FAILED_PRECONDITION,
      })

      expect(errorHandlerMock.formatError).toHaveBeenCalledWith(error)
      expect(serverLoggerMock.info).toHaveBeenCalledWith('GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.warn).toHaveBeenCalledWith('GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })

    it('throws unless response value provided', async () => {
      errorHandlerMock.mapGrpcStatusCode.mockReturnValue(grpc.status.INTERNAL)
      await expect(client.foo(fooRequest).res).rejects.toThrow(
        'Missing or no result for method handler at path /foo.TestSvc/Foo',
      )
    })
  })

  describe('if error handler is not provided', () => {
    beforeAll(async () => {
      ;[server, client] = await startService(
        {
          foo: fooMock,
          fooClientStream: jest.fn(),
          fooServerStream: jest.fn(),
          fooBidiStream: jest.fn(),
        },
        undefined,
      )
    })

    it('receives data from client in its correct form', async () => {
      fooMock.mockResolvedValue({ result: 'ok' })

      const response = await client.foo(fooRequest).res

      expect(response).toEqual({ result: 'ok' })
    })

    it('handles error using default unknown grpc code', async () => {
      class ConflictError extends Error {
        readonly type = 'ApplicationError'
        readonly code = 'conflict'
      }
      fooMock.mockRejectedValue(new ConflictError())

      await expect(client.foo(fooRequest).res).rejects.toMatchObject({
        code: 'conflict',
        grpcCode: grpc.status.UNKNOWN,
      })

      expect(serverLoggerMock.error).toHaveBeenCalledWith('GRPC Service /foo.TestSvc/Foo', expect.any(Object))
      expect(clientLoggerMock.error).toHaveBeenCalledWith('GRPC Client /foo.TestSvc/Foo', expect.any(Object))
    })
  })
})

async function startService(
  serviceImplementation: JoinServiceImplementation<Foo.ITestSvcServiceImplementation>,
  errorHandler?: IServiceErrorHandler,
): Promise<[IServer, Foo.ITestSvcClient]> {
  const serverCredentials = grpc.ServerCredentials.createInsecure()
  const server = new Server(serverCredentials, serverLoggerMock)

  const service = new Service<Foo.ITestSvcServiceImplementation>(
    Foo.testSvcServiceDefinition,
    serviceImplementation,
    serverLoggerMock,
    errorHandler,
  )
  server.addService(service)

  await server.start('0.0.0.0:0')

  const client = new Foo.TestSvcClient({
    address: `0.0.0.0:${server.port!}`,
    logger: clientLoggerMock,
  })

  return await Promise.resolve([server, client])
}
