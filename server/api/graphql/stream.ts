import { server } from "../../graphile/server"

export default eventHandler({
  /**
   * HTTP request handler
   */
  async handler(event) {
    // event._handled = true
    return await server.handleEventStreamEvent(event)
  },
})
