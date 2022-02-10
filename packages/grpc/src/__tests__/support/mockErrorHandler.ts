import { mocked } from 'jest-mock'
import { IGrpcErrorHandler } from '../../Service'

export const mockErrorHandler = () =>
  mocked<IGrpcErrorHandler>({
    formatError: jest.fn(),
    mapGrpcStatusCode: jest.fn(),
  })
