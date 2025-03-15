import { Server } from "@tus/server"
import { FileStore } from "@tus/file-store"

export const tusServer = new Server({
  path: "/api/upload",
  datastore: new FileStore({ directory: "./files" }),
  respectForwardedHeaders: true,
  relativeLocation: true,
})

tusServer.on("POST_RECEIVE_V2", (req, upload) => {
  console.debug(`Upload ${upload.id} with offset ${upload.offset} and size ${upload.size}`)
})

export default tusServer
