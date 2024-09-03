import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

import { config as loadConfig } from "dotenv"
import { run } from "graphile-worker"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
loadConfig({ path: resolve("../.env") })

const runner = await run({
  connectionString: process.env.DATABASE_URL,
  concurrency: 10,
  taskDirectory: resolve(__dirname, "./tasks"),
  preset: {
    worker: {
      fileExtensions: [".js", ".ts", ".mjs", ".cjs", ".py"]
    }
  },
})

await runner.promise
