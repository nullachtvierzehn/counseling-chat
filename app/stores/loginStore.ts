export interface LoginPayload {
  username: string
  password: string
}

export const useLoginStore = defineStore("login", () => {
  const { executeMutation: loginMutation } = useMutation(LoginDocument)
  const { executeMutation: logoutMutation } = useMutation(LogoutDocument)
  const { data: userData, executeQuery: refetchUserData } = useTypedQuery({
    query: CurrentUserDocument,
    variables: {}
  })

  const currentUser = computed(() => userData.value?.currentUser ?? null)
  const app = useNuxtApp()

  async function login({ username, password }: LoginPayload) {
    const { data, error } = await loginMutation({ username, password })
    if (error) {
      if (error?.graphQLErrors.some(e => e.extensions.code === "LOCKD")) {
        throw new Error("Too many login attempts. Account locked for five minutes.")
      }
      else if (error?.graphQLErrors.some(e => e.extensions.code === "CREDS")) {
        throw new Error("Wrong username or password.")
      }
      else {
        throw new Error(error.message, { cause: error })
      }
    }
    if (data?.login?.user) {
      await refetchUserData({ requestPolicy: "cache-only" }) // is cached after login mutation
      app.hooks.callHook("user:login", data.login.user)
    }
  }

  async function logout() {
    await logoutMutation({})
    await refetchUserData({ requestPolicy: "cache-and-network" })
    app.hooks.callHook("user:logout")
  }

  async function fetchState() {
    await refetchUserData({ requestPolicy: "cache-and-network" })
  }

  return { login, currentUser, logout, fetchState }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLoginStore, import.meta.hot))
}
