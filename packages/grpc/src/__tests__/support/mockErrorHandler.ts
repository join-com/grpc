import { mocked } from 'jest-mock'
import { IServiceErrorHandler } from '../../interfaces/IServiceErrorHandler'

export const mockErrorHandler = () =>
  mocked<IServiceErrorHandler>({
    formatError: jest.fn(),
    mapGrpcStatusCode: jest.fn(),
  })
