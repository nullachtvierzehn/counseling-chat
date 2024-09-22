import {
  type Client,
  createClient,
  type Exchange,
  fetchExchange,
  ssrExchange,
  subscriptionExchange,
} from "@urql/core"
import { devtoolsExchange } from "@urql/devtools"
import { cacheExchange, type SSRData } from "@urql/vue"
import { createClient as createWSClient } from "graphql-ws"
import { ref } from "vue"
import NodeWebSocket from "ws"

export default defineNuxtPlugin((nuxt) => {
  const ssrKey = "__URQL_DATA__"
  const requestHeaders = useRequestHeaders(["cookie", "authorization"])

  const ssr = ssrExchange({
    isClient: import.meta.client,
    initialState: import.meta.client
      ? (nuxt.payload[ssrKey] as SSRData)
      : undefined,
  })

  // when app is created in browser, restore SSR state from nuxt payload
  if (import.meta.client) {
    nuxt.hook("app:created", () => {
      const data = markRaw(nuxt.payload[ssrKey] as SSRData)
      console.debug("restored graphql data from server", data)
      ssr.restoreData(data)
    })
  }

  // when app has rendered in server, send SSR state to client
  if (import.meta.server) {
    nuxt.hook("app:rendered", () => {
      const data = markRaw(ssr.extractData())
      console.debug("restore graphql data for client", data)
      nuxt.payload[ssrKey] = data
    })
  }

  const url = new URL(
    "/api/graphql",
    import.meta.client
      ? window.location.href
      : process.env.ROOT_URL
      ?? `http://localhost:${process.env.FRONTEND_PORT ?? 3000}`
  )

  const wsClient = createWSClient({
    url: "ws://localhost:3000/api/graphql",
    webSocketImpl: import.meta.client ? WebSocket : (typeof Bun !== "undefined" ? WebSocket : NodeWebSocket),
  })

  const exchanges: Exchange[] = []

  // For browsers, support devtools unless in production.
  if (import.meta.client && process.env.NODE_ENV !== "production")
    exchanges.push(devtoolsExchange)

  // Add `ssr` in front of the `fetchExchange`
  exchanges.push(cacheExchange)
  exchanges.push(ssr)
  exchanges.push(fetchExchange)

  // For browsers, add `subscriptionExchange` after the `fetchExchange`.
  exchanges.push(
    subscriptionExchange({
      forwardSubscription(request) {
        const input = { ...request, query: request.query ?? "" }
        return {
          subscribe(sink) {
            const unsubscribe = wsClient.subscribe(input, sink)
            return { unsubscribe }
          },
        }
      },
    })
  )

  const client = createClient({
    url: url.toString(),
    exchanges,
    fetchOptions() {
      const headers: HeadersInit = { ...requestHeaders }
      console.debug("delegate request headers to graphql", requestHeaders)
      // headers["csrf-token"] = requestHeaders
      return { headers }
    },
  })

  nuxt.provide("urql", client)
  nuxt.vueApp.provide("$urql", ref(client))
})

declare module "#app" {
  interface NuxtApp {
    $urql: Client
  }
}
