import { makeServer } from "graphql-ws"
import { makeGraphQLWSConfig, defaultMaskError } from "postgraphile/grafserv"
import { PostGraphileAmberPreset as amber } from "postgraphile/presets/amber"
import { makePgService } from "postgraphile/adaptors/pg"
import { makeV4Preset } from "postgraphile/presets/v4"
import { grafserv } from "postgraphile/grafserv/h3/v1"
import { postgraphile } from "postgraphile"
import { PgSimplifyInflectionPreset } from "@graphile/simplify-inflection"
import { PostGraphileConnectionFilterPreset } from "postgraphile-plugin-connection-filter"
import { GraphQLError } from "graphql"

import pg from "pg"
import PassportLoginPlugin from "./plugins/PassportLoginPlugin"

export const pool = new pg.Pool({
  host: process.env.DATABASE_HOST ?? "localhost",
  port: parseInt(process.env.DATABASE_PORT ?? "5432"),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_AUTHENTICATOR,
  password: process.env.DATABASE_AUTHENTICATOR_PASSWORD
})

export const ownerPool = new pg.Pool({
  host: process.env.DATABASE_HOST ?? "localhost",
  port: parseInt(process.env.DATABASE_PORT ?? "5432"),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_OWNER,
  password: process.env.DATABASE_OWNER_PASSWORD
})

export const graphileInstance = postgraphile({
  extends: [
    amber,
    makeV4Preset({
      dynamicJson: true,
      subscriptions: true,
      watchPg: process.env.NODE_ENV === "development",
      setofFunctionsContainNulls: false,
      ignoreRBAC: false
    }),
    PgSimplifyInflectionPreset,
    PostGraphileConnectionFilterPreset
  ],
  plugins: [PassportLoginPlugin],
  gather: {
    pgStrictFunctions: true,
    installWatchFixtures: true,
  },
  grafserv: {
    graphqlPath: "/api/graphql",
    eventStreamPath: "/api/graphql/stream",
    watch: true,
    websockets: true,
    maskError: (error) => {
      if (!error.originalError) return defaultMaskError(error)
      const code = "code" in error.originalError ? error.originalError.code as string : null
      switch (code) {
        case "CDLEA":
        case "LOCKD":
        case "WEAKP":
        case "LOGIN":
        case "DNIED":
        case "CREDS":
        case "MODAT":
        case "TAKEN":
        case "VRFY1":
        case "ISMBR":
        case "VRFY2":
        case "NTFND":
        case "OWNER":
          // Expose application errors
          return new GraphQLError(error.message, {
            nodes: error.nodes,
            source: error.source,
            positions: error.positions,
            path: error.path,
            originalError: error.originalError,
            extensions: {
              code: "code" in error.originalError ? error.originalError.code : null,
              exception: error.originalError ?? error
            }
          })
        case null:
        default:
          // Default masking for all others
          return defaultMaskError(error)
      }
    }
  },
  grafast: {
    explain: true,
    async context(context, args) {
      // Add `ownerPool` to the context
      const contextAdditions: Partial<Grafast.Context> = {
        ownerPool,
        pgSettings: {
          ...args.contextValue?.pgSettings,
          role: process.env.DATABASE_VISITOR as string
        }
      }

      if (context.h3v1?.event) {
        const session = await useSession(context.h3v1.event, {
          password: process.env.SESSION_PASSWORD as string,
          cookie: { httpOnly: true, secure: true, sameSite: "strict" }
        })

        contextAdditions.session = session

        if (session.data.graphileSessionId) {
          contextAdditions.pgSettings!["jwt.claims.session_id"] = session.data.graphileSessionId
          // Update the last_active timestamp (but only do it at most once every 15 seconds to avoid too much churn).
          await ownerPool.query(
            "UPDATE app_private.sessions SET last_active = NOW() WHERE uuid = $1 AND last_active < NOW() - INTERVAL '15 seconds'",
            [session.data.graphileSessionId]
          )
        }
      }

      return contextAdditions
    }
  },
  pgServices: [
    makePgService({
      pool,
      pubsub: true,
      superuserConnectionString: process.env.SUPERUSER_DATABASE_URL,
      schemas: ["app_public"],
    }),
  ],
  schema: {
    exportSchemaIntrospectionResultPath: `${process.cwd()}/schema.json`,
    exportSchemaSDLPath: `${process.cwd()}/schema.graphql`,
    sortExport: true,
  }
})

export const server = graphileInstance.createServ(grafserv)
export const graphqlWsServer = makeServer(makeGraphQLWSConfig(server))
