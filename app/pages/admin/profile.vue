<template>
  <UButton @click="logout()">
    ausloggen
  </UButton>
</template>

<script lang="ts" setup>
const { executeMutation: logoutMutation } = useMutation(LogoutDocument)

const app = useNuxtApp()

async function logout() {
  await logoutMutation({})
  app.hooks.callHook("user:logout")
}
</script>
