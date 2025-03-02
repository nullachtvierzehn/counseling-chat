import { execSync } from "child_process"
import crypto from "crypto"
import fs from "fs"
import path from "path"
import { parse, stringify } from "envfile"
import inquirer from "inquirer"
import pg from "pg"

function generatePassword(n_bytes = 16) {
  return crypto.randomBytes(n_bytes).toString("base64url")
}

const envValues = fs.existsSync(".env")
  ? parse(fs.readFileSync(".env", { encoding: "utf-8" }))
  : {}

const answers = await inquirer.prompt(
  [
    {
      type: "input",
      name: "ROOT_DATABASE_URL",
      message:
        "Superuser connection string (to a _different_ database), so databases can be dropped/created (may not be necessary in production)",
      default: "postgres:///template1",
    },
    {
      type: "input",
      name: "DATABASE_HOST",
      message: "Where is the database?",
      default: "localhost",
    },
    {
      type: "number",
      name: "DATABASE_PORT",
      message: "Where is the port at the host?",
      default: 5432,
    },
    {
      type: "input",
      name: "DATABASE_NAME",
      message: "What is the name of the database?",
      default: "null814_cms",
    },
    {
      type: "input",
      name: "SUPERUSER_DATABASE_URL",
      message:
        "Can a superuser connect to the database? Helpful for setting up watchers.",
      default: answers => `postgres:///${answers.DATABASE_NAME}`,
    },
    {
      type: "input",
      name: "DATABASE_OWNER",
      message: "Who owns the database?",
      default: answers => `${answers.DATABASE_NAME}_owner`,
    },
    {
      type: "input",
      name: "DATABASE_OWNER_PASSWORD",
      message: "Password of database owner.",
      default: () => generatePassword(),
    },
    {
      type: "input",
      name: "DATABASE_AUTHENTICATOR",
      message:
        "Who is the Postgraphile database user? (Can be logged in, but has few privileges.)",
      default: answers => `${answers.DATABASE_NAME}_graphile`,
    },
    {
      type: "input",
      name: "DATABASE_AUTHENTICATOR_PASSWORD",
      message: "Password of graphile user.",
      default: () => generatePassword(),
    },
    {
      type: "input",
      name: "DATABASE_VISITOR",
      message:
        "Who is the database user representing application users? (Cannot be logged in directly.)",
      default: answers => `${answers.DATABASE_NAME}_app_users`,
    },
    {
      type: "input",
      name: "SESSION_PASSWORD",
      message: "A secret to encrypt sessions.",
      default: () => generatePassword(32),
    },
    {
      type: "input",
      name: "JWT_SECRET",
      message: "A secret for signing and verifying tokens.",
      default: () => generatePassword(32),
    },
    {
      type: "number",
      name: "FRONTEND_PORT",
      message: "Port for the nuxt application.",
      default: 3000,
    },
    {
      type: "input",
      name: "ROOT_URL",
      message:
        "The root url. This is needed any time we use absolute URLs. Must NOT end with a slash.",
      default: answers => `http://localhost:${answers.FRONTEND_PORT}`,
      transformer: value => value.trim().replace(/\/$/, ""),
    },
    {
      type: "input",
      name: "UPLOAD_FOLDER",
      message: "This is where file uploads are stored.",
      default: () => path.join(process.cwd(), "uploads"),
    },
    {
      type: "input",
      name: "SMTP_HOST",
      message: "Hostname for sending e-mails via SMTP:",
    },
    {
      type: "number",
      name: "SMTP_PORT",
      message: "SMTP port:",
      default: 587,
    },
    {
      type: "input",
      name: "SMTP_USER",
      message: "SMTP username:",
    },
    {
      type: "password",
      name: "SMTP_PASSWORD",
      message: "SMTP password:",
      mask: true,
    },
    {
      type: "confirm",
      name: "SMTP_REJECT_UNAUTHORIZED_CERTS",
      message: "Should I reject unauthorized TLS certs for SMTP?",
      default: true,
    },
  ],
  envValues
)

async function connectToDatabase() {
  const client = new pg.Client({
    connectionString: answers.ROOT_DATABASE_URL,
  })

  await client.connect()
  return client
}

const client = await connectToDatabase()

const {
  rows: [{ exists: existingOwner }],
} = await client.query(
  "SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = $1)",
  [answers.DATABASE_OWNER]
)
const {
  rows: [{ exists: existingAuthenticator }],
} = await client.query(
  "SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = $1)",
  [answers.DATABASE_AUTHENTICATOR]
)
const {
  rows: [{ exists: existingVisitor }],
} = await client.query(
  "SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = $1)",
  [answers.DATABASE_VISITOR]
)

const {
  rows: [{ exists: existingDatabase }],
} = await client.query(
  "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)",
  [answers.DATABASE_NAME]
)
const {
  rows: [{ exists: existingTestDatabase }],
} = await client.query(
  "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)",
  [answers.DATABASE_NAME + "_test"]
)
const {
  rows: [{ exists: existingShadowDatabase }],
} = await client.query(
  "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)",
  [answers.DATABASE_NAME + "_shadow"]
)

await client.end()

const dbSetupIsComplete
  = existingOwner
    && existingAuthenticator
    && existingVisitor
    && existingDatabase
    && existingTestDatabase
    && existingShadowDatabase

const dbSetupIsPartlyComplete
  = existingOwner
    || existingAuthenticator
    || existingVisitor
    || existingDatabase
    || existingTestDatabase
    || existingShadowDatabase

async function runDatabaseSetup() {
  const client = await connectToDatabase()

  // RESET database
  await client.query(`DROP DATABASE IF EXISTS ${answers.DATABASE_NAME};`)
  await client.query(`DROP DATABASE IF EXISTS ${answers.DATABASE_NAME}_shadow;`)
  await client.query(`DROP DATABASE IF EXISTS ${answers.DATABASE_NAME}_test;`)
  await client.query(`DROP ROLE IF EXISTS ${answers.DATABASE_VISITOR};`)
  await client.query(`DROP ROLE IF EXISTS ${answers.DATABASE_AUTHENTICATOR};`)
  await client.query(`DROP ROLE IF EXISTS ${answers.DATABASE_OWNER};`)

  // Now to set up the database cleanly:
  // Ref: https://devcenter.heroku.com/articles/heroku-postgresql#connection-permissions

  // This is the root role for the database`);
  await client.query(
    `CREATE ROLE ${answers.DATABASE_OWNER} WITH LOGIN PASSWORD '${answers.DATABASE_OWNER_PASSWORD}';`
  )

  // This is the no-access role that PostGraphile will run as by default`);
  await client.query(
    `CREATE ROLE ${answers.DATABASE_AUTHENTICATOR} WITH LOGIN PASSWORD '${answers.DATABASE_AUTHENTICATOR_PASSWORD}' NOINHERIT;`
  )

  // This is the role that PostGraphile will switch to (from ${DATABASE_AUTHENTICATOR}) during a GraphQL request
  await client.query(`CREATE ROLE ${answers.DATABASE_VISITOR};`)

  // This enables PostGraphile to switch from ${DATABASE_AUTHENTICATOR} to ${DATABASE_VISITOR}
  await client.query(
    `GRANT ${answers.DATABASE_VISITOR} TO ${answers.DATABASE_AUTHENTICATOR};`
  )

  await client.query(
    `CREATE DATABASE ${answers.DATABASE_NAME} OWNER ${answers.DATABASE_OWNER} TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE='de_DE.UTF-8' LC_CTYPE='de_DE.UTF-8';`
  )
  await client.query(
    `CREATE DATABASE ${answers.DATABASE_NAME}_test OWNER ${answers.DATABASE_OWNER} TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE='de_DE.UTF-8' LC_CTYPE='de_DE.UTF-8';`
  )
  await client.query(
    `CREATE DATABASE ${answers.DATABASE_NAME}_shadow OWNER ${answers.DATABASE_OWNER} TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE='de_DE.UTF-8' LC_CTYPE='de_DE.UTF-8';`
  )
  await client.query(
    `GRANT CONNECT ON DATABASE ${answers.DATABASE_NAME}, ${answers.DATABASE_NAME}_test, ${answers.DATABASE_NAME}_shadow TO ${answers.DATABASE_AUTHENTICATOR}, ${answers.DATABASE_VISITOR};`
  )

  await client.end()
  console.log(
    execSync(
      "bunx graphile-migrate reset --erase",
      {
        env: {
          ...process.env,
          ...answers,
        }
      }
    ).toString("utf-8")
  )
}

answers.NUXT_PORT = answers.FRONTEND_PORT
answers.NITRO_PORT = answers.FRONTEND_PORT
answers.NUXT_BACKEND_PORT = answers.BACKEND_PORT
fs.writeFileSync(".env", stringify(answers), { encoding: "utf-8" })

if (dbSetupIsPartlyComplete) {
  const confirm = await inquirer.prompt({
    type: "confirm",
    name: "reinstallDatabase",
    message: dbSetupIsComplete
      ? "Database setup already complete. Reinstall?"
      : "Database setup broken. Reinstall?",
    default: !dbSetupIsComplete,
  })
  if (confirm.reinstallDatabase) {
    console.log("Running the database setup...")
    await runDatabaseSetup()
    console.log("ok")
  }
}
else {
  await runDatabaseSetup()
}

await client.end()
