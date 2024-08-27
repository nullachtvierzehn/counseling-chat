import { Server } from "@tus/server"
import { FileStore } from "@tus/file-store"

export const tusServer = new Server({
  path: "/api/upload",
  datastore: new FileStore({ directory: "./files" }),
  respectForwardedHeaders: true,
  relativeLocation: true,
})

export default tusServer
