import type { InjectionKey } from "vue"

export const consultationKey: InjectionKey<ComputedRef<GetConsultationQuery["consultation"] | undefined>> = Symbol("consultation")

export const folderKey: InjectionKey<ComputedRef<GetFolderQuery["folder"] | undefined>> = Symbol("folder")
