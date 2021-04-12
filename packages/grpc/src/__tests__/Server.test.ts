import * as grpc from '@grpc/grpc-js'
import { Server } from '../Server'

describe('Server', () => {
  let server1: Server | undefined = undefined

  afterEach(async () => {
    if (server1 !== undefined) {
      await server1.tryShutdown()
    }
  })

  it('connects to the port when we call start', async () => {
    server1 = new Server(grpc.ServerCredentials.createInsecure())
    await server1.start('0.0.0.0:0')

    const usedPort = server1.port
    expect(usedPort).not.toBeFalsy()

    const server2 = new Server(grpc.ServerCredentials.createInsecure())

    await expect(
      server2.start(`0.0.0.0:${usedPort ?? 0}` as `${string}:${number}`),
    ).rejects.toThrow('No address added out of total 1 resolved')
  })
})
