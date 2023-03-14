import { Server } from '../Server'

describe('Server', () => {
  it('does not allow to start another server on the same port', async () => {
    const server = new Server()
    await server.start('0.0.0.0:0')

    const server2 = new Server()
    await expect(server2.start(`0.0.0.0:${server.port!}`)).rejects.toThrow(
      `Can not start gRPC server for host (0.0.0.0:${server.port!})`,
    )

    await server.tryShutdown()
  })

  it('allows to start a another server if the port is released', async () => {
    const server = new Server()
    await server.start('0.0.0.0:0')
    server.forceShutdown()

    const server2 = new Server()
    await expect(server2.start(`0.0.0.0:${server.port!}`)).toResolve()
    server2.forceShutdown()
  })

  it('allows to start a server if the port is released', async () => {
    const server = new Server()
    await server.start('0.0.0.0:0')
    await server.tryShutdown()

    const server2 = new Server()
    await expect(server2.start(`0.0.0.0:${server.port!}`)).toResolve()
    server2.forceShutdown()
  })
})
