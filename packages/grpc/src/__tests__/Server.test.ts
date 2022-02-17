import { Server } from '../Server'

describe('Server', () => {
  let server: Server

  beforeAll(async () => {
    server = new Server()
    await server.start('0.0.0.0:0')
  })

  afterAll(async () => {
    await server.tryShutdown()
  })

  it('does not allow to start another server on the same port', async () => {
    const usedPort = server.port
    expect(usedPort).not.toBeFalsy()

    const server2 = new Server()
    await expect(server2.start(`0.0.0.0:${usedPort ?? 0}`)).rejects.toThrow('No address added out of total 1 resolved')
  })
})
