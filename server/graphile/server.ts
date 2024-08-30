import { makeServer } from "graphql-ws"
import { makeGraphQLWSConfig } from "postgraphile/grafserv"
import { PostGraphileAmberPreset as amber } from "postgraphile/presets/amber"
import { makePgService } from "postgraphile/adaptors/pg"
import { makeV4Preset } from "postgraphile/presets/v4"
import { grafserv } from "postgraphile/grafserv/h3/v1"
import { postgraphile } from "postgraphile"
import pg from "pg"

export const pool = new pg.Pool({
  host: "localhost",
  database: "counseling_db",
  user: process.env.DATABASE_AUTHENTICATOR,
  password: process.env.DATABASE_AUTHENTICATOR_PASSWORD
})

export const graphileInstance = postgraphile({
  extends: [amber, makeV4Preset({ dynamicJson: true })],
  plugins: [/* TopicMessageSubscriptionPlugin */],
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
      return {
        pgSettings: {
          ...args.contextValue?.pgSettings,
          role: process.env.DATABASE_VISITOR as string
        }
      }
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
