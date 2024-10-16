import type { InjectionKey } from "vue"

export const consultationKey: InjectionKey<ComputedRef<GetConsultationQuery["consultation"] | undefined>> = Symbol("consultation")
