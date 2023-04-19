/* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
import { credentials } from '@grpc/grpc-js'
import { Client } from '../Client'
import { IClientConfig } from '../interfaces/IClientConfig'
import { consistencyMetadataKey, eventualConsistencyMetadata } from '../metadata/Consistency'

const defaultConfig = {
  address: 'localhost',
  serviceDefinition: {},
  credentials: credentials.createInsecure(),
} as const

class TestClient extends Client {
  public constructor(config: IClientConfig, serviceName: string) {
    super(config, serviceName)
  }
  public override makeRequest = jest.fn()
}

const metadataArgumentPosition = {
  bidiStreamRequest: 1,
  clientStreamRequest: 1,
  serverStreamRequest: 2,
  unaryRequest: 2,
} as const

describe('Client', () => {
  describe('Consistency Metadata', () => {
    describe('Automatically add consistency metadata if provided in the config', () => {
      let client: TestClient
      beforeEach(() => {
        client = new TestClient({ ...defaultConfig, consistency: 'eventual' }, 'testService')
      })
      it('On makeBidiStreamRequest', () => {
        client.makeBidiStreamRequest('testMethod', {})
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.bidiStreamRequest].get(consistencyMetadataKey)).toEqual(['eventual'])
      })
      it('On makeClientStreamRequest', () => {
        client.makeClientStreamRequest('testMethod', {})
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.clientStreamRequest].get(consistencyMetadataKey)).toEqual(['eventual'])
      })
      it('On makeUnaryRequest', () => {
        client.makeUnaryRequest('testMethod', {})
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.unaryRequest].get(consistencyMetadataKey)).toEqual(['eventual'])
      })
      it('On makeServerStreamRequest', () => {
        client.makeServerStreamRequest('testMethod', {})
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.serverStreamRequest].get(consistencyMetadataKey)).toEqual(['eventual'])
      })
    })
    describe('Override consistency metadata from the one provided in the config', () => {
      let client: TestClient
      beforeEach(() => {
        client = new TestClient({ ...defaultConfig, consistency: 'strong' }, 'testService')
      })
      it('On makeBidiStreamRequest', () => {
        client.makeBidiStreamRequest('testMethod', eventualConsistencyMetadata)
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.bidiStreamRequest].get(consistencyMetadataKey)).toEqual(['eventual'])
      })
      it('On makeClientStreamRequest', () => {
        client.makeClientStreamRequest('testMethod', eventualConsistencyMetadata)
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.clientStreamRequest].get(consistencyMetadataKey)).toEqual(['eventual'])
      })
      it('On makeUnaryRequest', () => {
        client.makeUnaryRequest('testMethod', {}, eventualConsistencyMetadata)
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.unaryRequest].get(consistencyMetadataKey)).toEqual(['eventual'])
      })
      it('On makeServerStreamRequest', () => {
        client.makeServerStreamRequest('testMethod', {}, eventualConsistencyMetadata)
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.serverStreamRequest].get(consistencyMetadataKey)).toEqual(['eventual'])
      })
    })

    describe('Do not include consistency metadata if not provided in the config', () => {
      let client: TestClient
      beforeEach(() => {
        client = new TestClient(defaultConfig, 'testService')
      })
      it('On makeBidiStreamRequest', () => {
        client.makeBidiStreamRequest('testMethod')
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.bidiStreamRequest].get(consistencyMetadataKey)).toEqual([])
      })
      it('On makeClientStreamRequest', () => {
        client.makeClientStreamRequest('testMethod')
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.clientStreamRequest].get(consistencyMetadataKey)).toEqual([])
      })
      it('On makeUnaryRequest', () => {
        client.makeUnaryRequest('testMethod', {})
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.unaryRequest].get(consistencyMetadataKey)).toEqual([])
      })
      it('On makeServerStreamRequest', () => {
        client.makeServerStreamRequest('testMethod', {})
        expect(client.makeRequest.mock.lastCall[metadataArgumentPosition.serverStreamRequest].get(consistencyMetadataKey)).toEqual([])
      })
    })
  })
})
