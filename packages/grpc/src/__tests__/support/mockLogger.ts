import { mocked } from 'jest-mock'
import { INoDebugLogger } from '../../interfaces/ILogger'

export const mockLogger = () =>
  mocked<INoDebugLogger>({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })
