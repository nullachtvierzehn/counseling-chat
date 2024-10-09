<template>
  <UButton @click="logout()">
    ausloggen
  </UButton>
</template>

<script lang="ts" setup>
const { executeMutation: logoutMutation } = useLogoutMutation()

const app = useNuxtApp()

async function logout() {
  await logoutMutation({})
  app.hooks.callHook("user:logout")
}
</script>
