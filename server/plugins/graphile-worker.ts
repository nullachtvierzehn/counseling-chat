import { run } from "graphile-worker"
import type {} from "graphile-config"
import type {} from "graphile-worker"
import { LoadTaskFromExecutableFilePlugin } from "graphile-worker/dist/plugins/LoadTaskFromExecutableFilePlugin"
import { LoadTaskFromJsPlugin } from "graphile-worker/dist/plugins/LoadTaskFromJsPlugin"

const preset: GraphileConfig.Preset = {
  plugins: [LoadTaskFromExecutableFilePlugin, LoadTaskFromJsPlugin],
  worker: {
    connectionString: "pg:///timo",
    maxPoolSize: 10,
    pollInterval: 2000,
    preparedStatements: true,
    schema: "graphile_worker",
    // crontabFile: `${__dirname}/crontab`,
    concurrentJobs: 5,
    // fileExtensions: [".js", ".cjs", ".mjs", ".ts", ".cts", ".mts", ".py"],

    // taskDirectory: `${__dirname}/tasks`,
  },
}

export default defineNitroPlugin(async (nitroApp) => {
  const runner = await run({ preset })
  await runner.promise

  nitroApp.hooks.hook("close", async () => {
    console.log("Stopping graphile worker.")
    await runner.stop()
    console.log("Graphile worker stopped.")
  })
})
