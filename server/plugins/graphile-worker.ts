import { run } from "graphile-worker"
import type {} from "graphile-config"
import type {} from "graphile-worker"

import { ownerPool } from "../graphile/server"

export default defineNitroPlugin(async (nitroApp) => {
  const runner = await run({
    pgPool: ownerPool,
    concurrency: 5,
    pollInterval: 2000,
    schema: "graphile_worker",
    taskList: {
      async test2(payload) {
        console.log(payload)
      }
    }
  })

  nitroApp.hooks.hook("close", async () => {
    console.log("Stopping graphile worker.")
    await runner.stop()
    console.log("Graphile worker stopped.")
  })

  runner.promise.catch((error) => {
    console.error(error)
    process.exit(1)
  })

  await runner.promise
})
