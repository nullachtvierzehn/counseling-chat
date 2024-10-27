<template>
  <article>
    <h1>Login</h1>
    <form @submit.prevent="login">
      <input v-model="email" type="text" placeholder="Email">
      <input v-model="password" type="password" placeholder="Password">
      <button type="submit">
        Login
      </button>
    </form>
  </article>
</template>

<script lang="ts" setup>
const { executeMutation: loginMutation } = useMutation(LoginDocument)
const email = ref("")
const password = ref("")
async function login() {
  await loginMutation({ username: toValue(email), password: toValue(password) })
}
</script>
