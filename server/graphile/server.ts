import { makeServer } from "graphql-ws"
import { makeGraphQLWSConfig } from "postgraphile/grafserv"
import { PostGraphileAmberPreset as amber } from "postgraphile/presets/amber"
import { makePgService } from "postgraphile/adaptors/pg"
import { makeV4Preset } from "postgraphile/presets/v4"
import { grafserv } from "postgraphile/grafserv/h3/v1"
import { postgraphile } from "postgraphile"
import { PgSimplifyInflectionPreset } from "@graphile/simplify-inflection"
import { PostGraphileConnectionFilterPreset } from "postgraphile-plugin-connection-filter"

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
  extends: [amber, makeV4Preset({ dynamicJson: true }), PgSimplifyInflectionPreset, PostGraphileConnectionFilterPreset],
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
})

export const server = graphileInstance.createServ(grafserv)
export const graphqlWsServer = makeServer(makeGraphQLWSConfig(server))
