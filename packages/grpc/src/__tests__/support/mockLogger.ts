import { mocked } from 'jest-mock'
import { INoDebugLogger } from '../../interfaces/ILogger'

export function mockLogger() {
  return mocked<INoDebugLogger>({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })
}
