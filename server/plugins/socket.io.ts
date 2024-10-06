import type { NitroApp } from "nitropack"
import { Server as Engine } from "engine.io"
import { Server } from "socket.io"
import { defineEventHandler } from "h3"

// https://socket.io/how-to/use-with-nuxt
export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine()
  const io = new Server()

  io.bind(engine as any)

  io.on("connection", (socket) => {
    console.log("incoming connection", socket.id)
    socket.on("disconnect", () => {
      console.log("closed connection", socket.id)
    })
  })

  io.on("connect", (socket) => {
    console.log("socket connected", socket.id)
  })

  nitroApp.router.use(
    "/socket.io/",
    defineEventHandler({
      handler(event) {
        engine.handleRequest(event.node.req, event.node.res)
        event._handled = true
      },
      websocket: {
        open(peer) {
          const nodeContext = peer.ctx.node
          const req = nodeContext.req

          // @ts-expect-error private method
          engine.prepare(req)

          const rawSocket = nodeContext.req.socket
          const websocket = nodeContext.ws

          // @ts-expect-error private method
          engine.onWebSocket(req, rawSocket, websocket)
        },
      },
    }),
  )
})
