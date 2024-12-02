import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

import findConfig from "find-config"
import { config as loadConfig } from "dotenv"
import { run } from "graphile-worker"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const configPath = findConfig(".env")
if (!configPath) throw new Error(".env not found. Please run `bun setup.mjs`.")

const { parsed: config, error } = loadConfig({ path: configPath })
if (error) {
  console.error(error.message)
  console.error("Failed to parse the .env file. Please re-create it with `bun setup.mjs`.")
  process.exit(1)
}

if (!config) {
  console.error("No configs found in .env file. Please re-create it with `bun setup.mjs")
  process.exit(2)
}

const runner = await run({
  connectionString: `postgres://${config.DATABASE_OWNER}:${config.DATABASE_OWNER_PASSWORD}@${config.DATABASE_HOST}:${config.DATABASE_PORT}/${config.DATABASE_NAME}`,
  concurrency: 10,
  taskDirectory: resolve(__dirname, "./tasks"),
  preset: {
    worker: {
      fileExtensions: [".js", ".ts", ".mjs", ".cjs", ".py"]
    }
  },
})

await runner.promise
