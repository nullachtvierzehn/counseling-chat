import { server } from "../graphile/server"

// Adapted from https://grafast.org/grafserv/servers/nuxt/#graphql-endpoint
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
  websocket: server.makeWsHandler()
})
