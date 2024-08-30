import { CloseCode } from "graphql-ws"
import { server, graphqlWsServer } from "../graphile/server"

export default eventHandler({
  /**
   * HTTP request handler
   */
  handler(event) {
    return getHeader(event, "accept") === "text/event-stream"
      ? server.handleEventStreamEvent(event)
      : server.handleGraphQLEvent(event)
  },
  /**
   * WS request handler
   */
  websocket: {
    open(peer) {
      const { ws: socket, req } = peer.ctx.node
      const closed = graphqlWsServer.opened(
        {
          protocol: socket.protocol, // will be validated
          send: data =>
            new Promise((resolve, reject) => {
              socket.send(data, (err: Error) =>
                err ? reject(err) : resolve(),
              )
            }), // control your data flow by timing the promise resolve
          close: (code, reason) => socket.close(code, reason), // there are protocol standard closures
          onMessage: cb =>
            socket.on("message", async (event: any) => {
              try {
                // wait for the the operation to complete
                // - if init message, waits for connect
                // - if query/mutation, waits for result
                // - if subscription, waits for complete
                await cb(event.toString())
              }
              catch (err: any) {
                try {
                  // all errors that could be thrown during the
                  // execution of operations will be caught here
                  socket.close(CloseCode.InternalServerError, err.message)
                }
                catch {
                  /* noop */
                  console.error("failed to close socket")
                }
              }
            }),
        },
        // pass values to the `extra` field in the context
        { socket, request: req },
      )
      socket.once("close", closed)
    },
  },
})
