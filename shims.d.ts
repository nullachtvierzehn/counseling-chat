import type { Pool } from "pg"
import type { SessionData } from "h3"
import type { HookResult } from "@nuxt/schema"

declare global {
  type SessionUpdate<T extends SessionData = SessionData> =
    Partial<SessionData<T>>
    | ((oldData: SessionData<T>) => Partial<SessionData<T>> | undefined)

  namespace Grafast {
    interface Context {
      ownerPool: Pool
      session?: {
        readonly id: string | undefined
        readonly data: SessionData
        update: (update: SessionUpdate<SessionData>) => Promise<void>
        clear: () => Promise<void>
      }
    }
  }
}

declare module "#app" {
  interface RuntimeNuxtHooks {
    "user:login": ({ id: string, username: string }) => HookResult
    "user:logout": () => HookResult
  }
}
