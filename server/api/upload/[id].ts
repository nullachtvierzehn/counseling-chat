import tusServer from "../../tus/server"

// https://github.com/tus/tus-node-server/tree/main/packages/server#example-integrate-tus-into-nextjs
export default eventHandler((event) => {
  tusServer.handle(event.node.req, event.node.res)
  event._handled = true
})
