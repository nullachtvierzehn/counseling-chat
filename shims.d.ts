import type { Pool } from "pg"
import type { SessionData } from "h3"

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
        update: (update: SessionUpdate<SessionData>) => Promise<any>
        clear: () => Promise<any>
      }
    }
  }
}
