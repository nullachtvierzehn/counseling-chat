<template>
  <article>
    <h1>Login</h1>
    <form @submit.prevent="submitLogin">
      <input v-model="email" type="text" placeholder="Email">
      <input v-model="password" type="password" placeholder="Password">
      <button type="submit">
        Login
      </button>
      <pre>{{ loginStore.currentUser }}</pre>
    </form>
  </article>
</template>

<script lang="ts" setup>
const loginStore = useLoginStore()

const email = ref("")
const password = ref("")
async function submitLogin() {
  console.log(loginStore)
  console.log(loginStore.login)
  await loginStore.login({ username: toValue(email), password: toValue(password) })
}
</script>
