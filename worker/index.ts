import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

import findConfig from "find-config"
import { config as loadConfig } from "dotenv"
import { run } from "graphile-worker"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const configPath = findConfig(".env")
if (configPath) loadConfig({ path: configPath })

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
