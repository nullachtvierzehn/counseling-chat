// `nuxt/kit` is a helper subpath import you can use when defining local modules
// that means you do not need to add `@nuxt/kit` to your project's dependencies
import { createResolver, defineNuxtModule } from "nuxt/kit"
import { run } from "graphile-worker"

export default defineNuxtModule({
  meta: {
    name: "graphile worker"
  },
  async setup(_options, app) {
    const { resolve } = createResolver(import.meta.url)

    const runner = await run({
      connectionString: process.env.DATABASE_URL,
      concurrency: 5,
      pollInterval: 2000,
      schema: "graphile_worker",
      noHandleSignals: true, // signals are handled by Nuxt.
      preset: {
        worker: {
          // fileExtensions: [".js", ".cjs", ".mjs", ".ts", ".cts", ".mts", ".py"],
        }
      },
      taskDirectory: resolve("./tasks")
    })

    app.hook("close", async () => {
      console.log("Stop graphile worker, because Nuxt is going to halt.")
      await runner.stop()
    })

    runner.promise.catch((uncaughtError) => {
      console.error("Graphile worker failed due to an uncaught error.")
      console.error(uncaughtError)
      process.exit(1)
    })

    runner.promise.then(() => {
      console.log("Graphile worker stopped.")
    })
  }
})
