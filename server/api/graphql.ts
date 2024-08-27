import { CloseCode, makeServer } from "graphql-ws"
import { makeGraphQLWSConfig } from "postgraphile/grafserv"
import { PostGraphileAmberPreset as amber } from "postgraphile/presets/amber"
import { makePgService } from "postgraphile/adaptors/pg"
import { makeV4Preset } from "postgraphile/presets/v4"
import { grafserv } from "postgraphile/grafserv/h3/v1"
import { postgraphile } from "postgraphile"
import { makeExtendSchemaPlugin, gql } from "graphile-utils"
import { context, lambda, listen } from "postgraphile/grafast"
import { jsonParse } from "postgraphile/@dataplan/json"

const TopicMessageSubscriptionPlugin = makeExtendSchemaPlugin((build) => {
  const { messages /* topic, currentProfileClaims */ }
    = build.input.pgRegistry.pgResources
  return {
    typeDefs: gql`
      extend type Subscription {
        topicMessage(topicId: BigInt!): TopicMessageSubscriptionPayload
      }

      type TopicMessageSubscriptionPayload {
        event: String
        message: Message
        messageId: UUID
      }
    `,
    plans: {
      Subscription: {
        topicMessage: {
          subscribePlan(_$root, args) {
            const $pgSubscriber = context().get("pgSubscriber")
            const $topicId = args.get("topicId")
            const $topic = lambda($topicId, id => `topic:${id}:message`)
            return listen($pgSubscriber, $topic, jsonParse)
          },
          plan($event) {
            return $event
          },
        },
      },
      TopicMessageSubscriptionPayload: {
        event($event) {
          return $event.get("event")
        },
        message($event) {
          const $id = $event.get("id")
          return messages.get({ id: $id })
        },
        messageId($event) {
          const $msgId = $event.get("id")
          return $msgId
        },
      },
    },
  }
})

// see https://github.com/stlbucket/function-bucket/blob/main/server/api/graphile.config.ts
const graphileInstance = postgraphile({
  extends: [amber, makeV4Preset({ dynamicJson: true })],
  plugins: [TopicMessageSubscriptionPlugin],
  grafserv: {
    graphqlPath: "/api/graphql",
    websockets: true,
  },
  grafast: {
    explain: true,
  },
  pgServices: [
    makePgService({
      pubsub: true,
    }),
  ],
})

const serv = graphileInstance.createServ(grafserv)
const graphqlWsServer = makeServer(makeGraphQLWSConfig(serv))

export default eventHandler({
  /**
   * HTTP request handler
   */
  handler: event => serv.handleGraphQLEvent(event),
  /**
   * WS request handler
   */
  websocket: {
    open(peer) {
      const { ws: socket, req } = peer.ctx.node
      const closed = graphqlWsServer.opened(
        {
          protocol: socket.protocol, // will be validated
          send: data =>
            new Promise((resolve, reject) => {
              socket.send(data, (err: Error) =>
                err ? reject(err) : resolve(),
              )
            }), // control your data flow by timing the promise resolve
          close: (code, reason) => socket.close(code, reason), // there are protocol standard closures
          onMessage: cb =>
            socket.on("message", async (event: any) => {
              try {
                // wait for the the operation to complete
                // - if init message, waits for connect
                // - if query/mutation, waits for result
                // - if subscription, waits for complete
                await cb(event.toString())
              }
              catch (err: any) {
                try {
                  // all errors that could be thrown during the
                  // execution of operations will be caught here
                  socket.close(CloseCode.InternalServerError, err.message)
                }
                catch {
                  /* noop */
                  console.error("failed to close socket")
                }
              }
            }),
        },
        // pass values to the `extra` field in the context
        { socket, request: req },
      )
      socket.once("close", closed)
    },
  },
})
