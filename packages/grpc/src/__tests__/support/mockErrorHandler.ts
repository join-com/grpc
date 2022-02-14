import { mocked } from 'jest-mock'
import { IServiceErrorHandler } from '../../interfaces/IServiceErrorHandler'

export const mockErrorHandler = () =>
  mocked<Required<IServiceErrorHandler>>({
    formatError: jest.fn(),
    mapGrpcStatusCode: jest.fn(),
  })
